from urllib.parse import urlparse
from app.core.config import settings
from app.models.schemas import VerificationStatus

class SourceVerifier:
    def __init__(self):
        self.allowed_domains = [d.lower() for d in settings.TRUSTED_SOURCE_DOMAINS]

    def is_domain_allowed(self, url: str) -> bool:
        if not url:
            return False
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            if not hostname:
                return False
            hostname = hostname.lower()
            
            # Prevent private/internal network IP access (SSRF protection)
            if hostname in ["localhost", "127.0.0.1", "0.0.0.0"] or hostname.startswith("192.168.") or hostname.startswith("10.") or hostname.startswith("172."):
                return False

            for domain in self.allowed_domains:
                if hostname == domain or hostname.endswith("." + domain):
                    return True
            return False
        except Exception:
            return False

    def evaluate_verification_status(self, source_url: str, is_official_claimed: bool = False) -> VerificationStatus:
        if not source_url:
            return VerificationStatus.UNVERIFIED
        
        if self.is_domain_allowed(source_url):
            return VerificationStatus.OFFICIAL
        
        return VerificationStatus.UNVERIFIED

source_verifier = SourceVerifier()
