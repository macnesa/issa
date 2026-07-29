const apiClientMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("../../config/apiClient", () => ({
  default: apiClientMock,
}));

import { submitParentDemoLogin } from "./actionCreator";

describe("Parent public demo login", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("posts an empty request and stores the returned session", async () => {
    const demoToken = [
      btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
      btoa(JSON.stringify({
        accessMode: "demo",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })),
      "signature",
    ].join(".");
    apiClientMock.post.mockResolvedValue({
      data: {
        access_token: demoToken,
        id: 21,
      },
    });

    await submitParentDemoLogin()(vi.fn());

    expect(apiClientMock.post).toHaveBeenCalledWith("/users/demo-login");
    expect(localStorage.getItem("access_token")).toBe(demoToken);
    expect(localStorage.getItem("userId")).toBe("21");
  });

  test("maps rate-limit and unavailable responses without exposing internals", async () => {
    apiClientMock.post.mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          error: {
            code: "publicDemoRateLimitExceeded",
            message: "internal rate limiter detail",
          },
        },
      },
    });

    await expect(submitParentDemoLogin()(vi.fn())).rejects.toEqual(
      expect.objectContaining({
        message: "Batas akses demo telah tercapai. Coba lagi nanti.",
      })
    );

    apiClientMock.post.mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          error: {
            code: "publicDemoConfigurationError",
            message: "missing server configuration",
          },
        },
      },
    });

    await expect(submitParentDemoLogin()(vi.fn())).rejects.toEqual(
      expect.objectContaining({
        message: "Demo Parent sedang tidak tersedia.",
      })
    );
  });
});
