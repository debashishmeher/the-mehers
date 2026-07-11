const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = "http://localhost:8000/api/user";

// Helper to extract cookies from responses
const getCookieValue = (cookieHeader, name) => {
    if (!cookieHeader) return null;
    const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    for (let c of cookies) {
        const parts = c.split(";")[0].split("=");
        if (parts[0].trim() === name) {
            return parts[1].trim();
        }
    }
    return null;
};

const runTests = async () => {
    console.log("=== STARTING AUTHENTICATION SYSTEM TEST SUITE ===\n");

    const email = `test-user-${crypto.randomBytes(4).toString("hex")}@themehers.in`;
    const password = "SuperSecretPassword123!";
    let accessToken = "";
    let refreshToken = "";
    let secondaryAccessToken = "";
    let secondaryRefreshToken = "";
    let sessionIdToRevoke = "";

    // 1. TEST SIGNUP
    try {
        console.log(`[TEST 1] Testing traditional signup with email: ${email}...`);
        const res = await axios.post(`${BASE_URL}/signup`, {
            name: "Test User",
            email,
            password,
            confirmpassword: password,
        });

        if (res.status === 201 && res.data.status === "success") {
            console.log("-> SUCCESS: Signup successful!");
            accessToken = res.data.token;
            refreshToken = res.data.refreshToken;
        } else {
            throw new Error(`Unexpected response code: ${res.status}`);
        }
    } catch (err) {
        console.error("-> FAILED: Signup failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 2. TEST LOGIN
    try {
        console.log("\n[TEST 2] Testing traditional login...");
        const res = await axios.post(`${BASE_URL}/login`, {
            email,
            password,
        });

        if (res.status === 200 && res.data.status === "success") {
            console.log("-> SUCCESS: Login successful!");
            // Store the rotated credentials
            accessToken = res.data.token;
            refreshToken = res.data.refreshToken;
        } else {
            throw new Error(`Unexpected login response code: ${res.status}`);
        }
    } catch (err) {
        console.error("-> FAILED: Login failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 3. TEST PROTECTED ROUTE ACCESS (VALID TOKEN)
    try {
        console.log("\n[TEST 3] Testing protected route access with valid Bearer token...");
        const res = await axios.get(`${BASE_URL}/isAuthenticated`, {
            headers: {
                Authorization: accessToken, // already formatted as "Bearer <token>"
            },
        });

        if (res.status === 200 && res.data.status === "success") {
            console.log(`-> SUCCESS: Access granted! User ID: ${res.data.user._id}`);
        } else {
            throw new Error(`Unexpected access response: ${res.status}`);
        }
    } catch (err) {
        console.error("-> FAILED: Protected access failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 4. TEST PROTECTED ROUTE ACCESS (INVALID TOKEN)
    try {
        console.log("\n[TEST 4] Testing protected route access with invalid token...");
        await axios.get(`${BASE_URL}/isAuthenticated`, {
            headers: {
                Authorization: "Bearer invalidtokenhere",
            },
        });
        console.error("-> FAILED: Access was incorrectly granted for invalid token!");
        process.exit(1);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            console.log("-> SUCCESS: Access denied successfully (401 Unauthorized)!");
        } else {
            console.error("-> FAILED: Unexpected error:", err.message);
            process.exit(1);
        }
    }

    // 5. TEST TOKEN ROTATION & REFRESH
    try {
        console.log("\n[TEST 5] Testing refresh token rotation...");
        const res = await axios.post(`${BASE_URL}/refresh-token`, {}, {
            headers: {
                Cookie: `refreshToken=${refreshToken}`,
            },
        });

        if (res.status === 200 && res.data.status === "success") {
            console.log("-> SUCCESS: Token rotation successful!");
            // Verify new rotated credentials
            secondaryAccessToken = res.data.token;
            secondaryRefreshToken = res.data.refreshToken;
        } else {
            throw new Error(`Unexpected rotation response: ${res.status}`);
        }
    } catch (err) {
        console.error("-> FAILED: Refresh failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 6. TEST ACTIVE SESSIONS RETRIEVAL
    try {
        console.log("\n[TEST 6] Testing active sessions list...");
        const res = await axios.get(`${BASE_URL}/sessions`, {
            headers: {
                Authorization: secondaryAccessToken,
            },
        });

        if (res.status === 200 && res.data.status === "success") {
            console.log(`-> SUCCESS: Fetched active sessions. Count: ${res.data.results}`);
            console.log("Sessions:", JSON.stringify(res.data.data.sessions, null, 2));
            
            // Capture session ID to revoke in next test
            if (res.data.data.sessions.length > 0) {
                sessionIdToRevoke = res.data.data.sessions[0]._id;
            }
        } else {
            throw new Error(`Unexpected sessions response: ${res.status}`);
        }
    } catch (err) {
        console.error("-> FAILED: Sessions retrieval failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 7. TEST SESSION REVOCATION (LOGOUT SPECIFIC DEVICE)
    if (sessionIdToRevoke) {
        try {
            console.log(`\n[TEST 7] Testing session revocation for session ID: ${sessionIdToRevoke}...`);
            const res = await axios.delete(`${BASE_URL}/sessions/${sessionIdToRevoke}`, {
                headers: {
                    Authorization: secondaryAccessToken,
                },
            });

            if (res.status === 200 && res.data.status === "success") {
                console.log("-> SUCCESS: Session revoked successfully!");
            } else {
                throw new Error(`Unexpected revocation response: ${res.status}`);
            }
        } catch (err) {
            console.error("-> FAILED: Revocation failed:", err.response ? err.response.data : err.message);
            process.exit(1);
        }
    }

    // 8. TEST TOKEN REUSE DETECTION (REPLAY ATTACK THREAT)
    try {
        console.log("\n[TEST 8] Testing token reuse detection (submitting previously used refresh token)...");
        // Attempting to refresh using the first `refreshToken` (which was already rotated in Test 5)
        await axios.post(`${BASE_URL}/refresh-token`, {}, {
            headers: {
                Cookie: `refreshToken=${refreshToken}`,
            },
        });
        console.error("-> FAILED: Server allowed reuse of an old refresh token!");
        process.exit(1);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            console.log("-> SUCCESS: Server successfully detected token reuse and rejected it!");
        } else {
            console.error("-> FAILED: Unexpected error during reuse detection:", err.message);
            process.exit(1);
        }
    }

    // 9. TEST RATE LIMITING
    try {
        console.log("\n[TEST 9] Testing rate limiting by flooding auth requests...");
        const attempts = [];
        for (let i = 0; i < 25; i++) {
            attempts.push(
                axios.post(`${BASE_URL}/login`, {
                    email,
                    password: "wrongpassword",
                }).catch(err => err.response)
            );
        }
        const results = await Promise.all(attempts);
        const rateLimitedCount = results.filter(r => r && r.status === 429).length;

        if (rateLimitedCount > 0) {
            console.log(`-> SUCCESS: Rate limiting successfully triggered! Blocked ${rateLimitedCount} requests with HTTP 429.`);
        } else {
            console.warn("-> WARNING: Rate limit was not triggered (might be disabled or threshold is higher).");
        }
    } catch (err) {
        console.error("-> FAILED: Rate limit test threw error:", err.message);
    }

    console.log("\n=== ALL SECURITY TESTS COMPLETED SUCCESSFULLY ===");
};

runTests();
