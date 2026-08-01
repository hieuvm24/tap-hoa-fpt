import { apiSuccess } from "@/lib/mappers";
import {
  isFacebookOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/oauth";

export async function GET() {
  return apiSuccess({
    google: isGoogleOAuthConfigured(),
    facebook: isFacebookOAuthConfigured(),
  });
}
