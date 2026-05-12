const axios     = require("axios");
const User      = require("../models/User");
const Workspace = require("../models/workspace");
const { encrypt, decrypt } = require("../utils/encryption");

const GH_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  "User-Agent":  "DevSpace",
  Accept:        "application/json",
});

/* ─────────────────────────────────────────────────────────────
   ITEM 1  GitHub OAuth
   ───────────────────────────────────────────────────────────── */

/** GET /api/github/oauth/url — returns the GitHub authorize URL */
exports.getOAuthUrl = (req, res) => {
  const { GITHUB_CLIENT_ID, CLIENT_URL } = process.env;
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ message: "GITHUB_CLIENT_ID not configured" });
  }

  // Use the authenticated userId as the state param (CSRF protection)
  const state = req.user._id.toString();
  const url   = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,read:user&state=${state}`;
  res.json({ url });
};

/** GET /api/github/oauth/callback?code=&state= — GitHub redirects here */
exports.oauthCallback = async (req, res) => {
  const { code, state } = req.query;
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, CLIENT_URL } = process.env;

  if (!code || !state) {
    return res.redirect(`${CLIENT_URL}/settings?github=error&reason=missing_params`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      console.error("[GitHub] Token exchange failed:", tokenRes.data);
      return res.redirect(`${CLIENT_URL}/settings?github=error&reason=token_exchange`);
    }

    // 2. Get GitHub user info
    const ghUserRes = await axios.get("https://api.github.com/user", {
      headers: GH_HEADERS(accessToken),
    });
    const ghUser = ghUserRes.data;

    // 3. Encrypt token
    const { encrypted, iv } = encrypt(accessToken);

    // 4. Save to the user identified by state param (userId)
    await User.findByIdAndUpdate(state, {
      github: {
        accessToken: encrypted,
        tokenIv:     iv,
        login:       ghUser.login,
        avatarUrl:   ghUser.avatar_url,
        connectedAt: new Date(),
      },
    });

    res.redirect(`${CLIENT_URL}/settings?github=connected`);
  } catch (err) {
    console.error("[GitHub] OAuth callback error:", err.message);
    res.redirect(`${CLIENT_URL}/settings?github=error&reason=server_error`);
  }
};

/** DELETE /api/github/oauth/disconnect — unlinks GitHub account */
exports.disconnectGitHub = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { github: 1 } });

    // Optionally clear workspace repo links where this user is the owner
    await Workspace.updateMany(
      { owner: req.user._id },
      { $unset: { github: 1 } }
    );

    res.json({ message: "GitHub disconnected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /api/github/repos — list user's repos */
exports.listRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+github");
    if (!user?.github?.accessToken) {
      return res.status(400).json({ message: "GitHub account not connected" });
    }

    const token = decrypt(user.github.accessToken, user.github.tokenIv);

    const { data } = await axios.get("https://api.github.com/user/repos", {
      headers: GH_HEADERS(token),
      params:  { sort: "updated", per_page: 50, type: "all" },
    });

    const repos = data.map((r) => ({
      id:            r.id,
      name:          r.name,
      fullName:      r.full_name,
      private:       r.private,
      url:           r.html_url,
      defaultBranch: r.default_branch,
    }));

    res.json(repos);
  } catch (err) {
    console.error("[GitHub] listRepos error:", err.message);
    res.status(500).json({ message: "Failed to fetch repositories" });
  }
};

/* ─────────────────────────────────────────────────────────────
   ITEM 2  Workspace Repo Link / Unlink
   ───────────────────────────────────────────────────────────── */

/** PATCH /api/workspaces/:workspaceId/github/link */
exports.linkRepo = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { repoOwner, repoName, repoFullName, repoUrl, defaultBranch } = req.body;

    if (!repoOwner || !repoName) {
      return res.status(400).json({ message: "repoOwner and repoName are required" });
    }

    const user = await User.findById(req.user._id).select("+github");
    if (!user?.github?.accessToken) {
      return res.status(400).json({ message: "Connect your GitHub account first" });
    }

    const token = decrypt(user.github.accessToken, user.github.tokenIv);

    // Register webhook
    let webhookId = null;
    const webhookUrl = `${process.env.SERVER_URL}/api/github/webhook`;
    try {
      const hookRes = await axios.post(
        `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`,
        {
          name:   "web",
          active: true,
          events: ["push", "pull_request"],
          config: {
            url:          webhookUrl,
            content_type: "json",
            secret:       process.env.GITHUB_WEBHOOK_SECRET,
          },
        },
        { headers: GH_HEADERS(token) }
      );
      webhookId = hookRes.data.id;
    } catch (hookErr) {
      // Webhook registration failure is non-fatal — repo link still saved
      console.warn("[GitHub] Webhook registration failed:", hookErr.response?.data || hookErr.message);
    }

    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        github: {
          repoOwner,
          repoName,
          repoFullName: repoFullName || `${repoOwner}/${repoName}`,
          repoUrl:      repoUrl || `https://github.com/${repoOwner}/${repoName}`,
          defaultBranch: defaultBranch || "main",
          webhookId,
          linkedBy:     req.user._id,
          linkedAt:     new Date(),
        },
      },
      { new: true }
    );

    res.json({ message: "Repository linked", workspace });
  } catch (err) {
    console.error("[GitHub] linkRepo error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/** DELETE /api/workspaces/:workspaceId/github/unlink */
exports.unlinkRepo = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    // Try to delete the webhook from GitHub
    if (workspace.github?.webhookId && workspace.github?.repoOwner) {
      try {
        const user  = await User.findById(req.user._id).select("+github");
        const token = decrypt(user.github.accessToken, user.github.tokenIv);
        await axios.delete(
          `https://api.github.com/repos/${workspace.github.repoOwner}/${workspace.github.repoName}/hooks/${workspace.github.webhookId}`,
          { headers: GH_HEADERS(token) }
        );
      } catch (delErr) {
        console.warn("[GitHub] Webhook deletion failed (non-fatal):", delErr.message);
      }
    }

    await Workspace.findByIdAndUpdate(workspaceId, { $unset: { github: 1 } });
    res.json({ message: "Repository unlinked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /api/github/me — get connected user's GitHub profile (for Settings UI) */
exports.getGitHubProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("github");
    if (!user?.github?.login) {
      return res.json({ connected: false });
    }
    // Never return encrypted token — only safe fields
    res.json({
      connected:   true,
      login:       user.github.login,
      avatarUrl:   user.github.avatarUrl,
      connectedAt: user.github.connectedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
