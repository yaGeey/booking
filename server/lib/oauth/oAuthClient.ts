import { z } from "zod";
import type { oAuthProviders, User } from "../../generated/prisma";
import { randomBytes, hash } from "node:crypto";
type Cookie = (name: string, value: string, options?: Record<string, unknown>) => void;

export default class OAuthClient<T> {
   private readonly cookie: Cookie;
   private readonly cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 10 * 1000,
   };
   private readonly provider: oAuthProviders;
   private readonly urls: {
      auth: string;
      token: string;
      userData: string;
   };
   private readonly cliendId: string;
   private readonly clientSecret: string;
   private readonly scope: string;
   private get redirectUri() {
      return new URL(this.provider, process.env.REDIRECT_URI);
   }
   private readonly tokenSchema = z.object({
      access_token: z.string(),
      token_type: z.string(),
   });
   private readonly userInfo: {
      schema: z.ZodSchema<T>;
      parser: (data: T) => { id: string; email: string; name: string; avatar: string | null };
   };

   constructor({
      cookie,
      provider,
      urls,
      clientId,
      clientSecret,
      scope,
      userInfo,
   }: {
      cookie: Cookie;
      provider: oAuthProviders;
      urls: { auth: string; token: string; userData: string };
      clientId: string;
      clientSecret: string;
      scope: string[];
      userInfo: {
         schema: z.ZodSchema<T>;
         parser: (data: T) => { id: string; email: string; name: string; avatar: string | null };
      };
   }) {
      this.cookie = cookie;
      this.provider = provider;
      this.urls = urls;
      this.cliendId = clientId;
      this.clientSecret = clientSecret;
      this.scope = scope.join(" ");
      this.userInfo = userInfo;
   }

   createAuthUrl() {
      const state = randomBytes(64).toString("hex").normalize();
      this.cookie("state", state, this.cookieOptions);

      // base url
      const url = new URL(this.urls.auth);
      url.searchParams.set("client_id", this.cliendId);
      url.searchParams.set("redirect_uri", this.redirectUri.toString());
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", this.scope);
      url.searchParams.set("state", state);

      // code challenge
      const codeVerifier = randomBytes(64).toString("hex").normalize();
      this.cookie("code_verifier", codeVerifier, this.cookieOptions);

      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("code_challenge", hash("sha256", codeVerifier, "base64url"));

      return url.toString();
   }

   async fetchToken(code: string, codeVerifier: string) {
      const res = await fetch(this.urls.token, {
         method: "POST",
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
         },
         body: new URLSearchParams({
            client_id: this.cliendId,
            client_secret: this.clientSecret,
            grant_type: "authorization_code",
            redirect_uri: this.redirectUri.toString(),
            code,
            code_verifier: codeVerifier,
         }),
      });
      const rawData = await res.json();
      return this.tokenSchema.parse(rawData);
   }

   async fetchUserData(token: string) {
      const res = await fetch(this.urls.userData, {
         method: "GET",
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
      });
      const rawData = await res.json();
      const data = this.userInfo.schema.parse(rawData);
      return this.userInfo.parser(data);
   }
}
