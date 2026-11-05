"""FastAPI endpoints for identity, authentication, and session management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity.dependencies import get_current_user
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.schemas import (
    EmailLoginRequest,
    EmailRegisterRequest,
    EmailVerifyRequest,
    GoogleLoginRequest,
    LogoutRequest,
    MessageResponse,
    OtpRequestResponse,
    PasswordForgotRequest,
    PasswordResetRequest,
    PhoneOtpRequest,
    PhoneOtpVerifyRequest,
    TokenRefreshRequest,
    TokenResponse,
    UserProfileResponse,
)
from tsotsa_api.modules.identity.service import IdentityService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_client_ip(request: Request) -> str:
    """Extract client IP address for rate limiting."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


def get_identity_service(db: AsyncSession = Depends(get_db_session)) -> IdentityService:
    """Dependency provider for IdentityService."""
    repo = IdentityRepository(db)
    return IdentityService(repository=repo)


@router.post(
    "/google",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Connexion Google Identity",
)
async def google_login(
    payload: GoogleLoginRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> TokenResponse:
    """Authenticate or register user with a verified Google Identity token."""
    ip = get_client_ip(request)
    return await service.authenticate_google(id_token_str=payload.id_token, ip_address=ip)


@router.post(
    "/phone/request",
    response_model=OtpRequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Demande de code OTP par SMS",
)
async def request_phone_otp(
    payload: PhoneOtpRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> OtpRequestResponse:
    """Send a 6-digit one-time password code to a phone number via SMS."""
    ip = get_client_ip(request)
    return await service.request_phone_otp(phone_e164=payload.phone_e164, ip_address=ip)


@router.post(
    "/phone/verify",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Validation du code OTP par SMS",
)
async def verify_phone_otp(
    payload: PhoneOtpVerifyRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> TokenResponse:
    """Validate SMS OTP code and log in or create a user account."""
    ip = get_client_ip(request)
    return await service.verify_phone_otp(
        phone_e164=payload.phone_e164,
        code=payload.code,
        display_name=payload.display_name,
        ip_address=ip,
    )


@router.post(
    "/email/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inscription par e-mail et mot de passe",
)
async def register_email(
    payload: EmailRegisterRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    """Create a new account with email and password and issue verification token."""
    ip = get_client_ip(request)
    await service.register_email(
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
        ip_address=ip,
    )
    return MessageResponse(
        message="Compte créé avec succès. Un e-mail de confirmation vous a été envoyé."
    )


@router.post(
    "/email/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Connexion par e-mail et mot de passe",
)
async def login_email(
    payload: EmailLoginRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> TokenResponse:
    """Authenticate user with email and bcrypt-hashed password."""
    ip = get_client_ip(request)
    return await service.login_email(
        email=payload.email,
        password=payload.password,
        ip_address=ip,
    )


@router.post(
    "/email/verify",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Vérification de l'adresse e-mail",
)
async def verify_email(
    payload: EmailVerifyRequest,
    service: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    """Confirm user email address via single-use token."""
    await service.verify_email_token(token_str=payload.token)
    return MessageResponse(message="Adresse e-mail vérifiée avec succès.")


@router.post(
    "/password/forgot",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Demande de réinitialisation de mot de passe",
)
async def forgot_password(
    payload: PasswordForgotRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    """Generate reset token. Returns identical message whether email exists or not."""
    ip = get_client_ip(request)
    await service.request_password_reset(email=payload.email, ip_address=ip)
    return MessageResponse(
        message="Si un compte correspond à cet e-mail, un lien de réinitialisation a été envoyé."
    )


@router.post(
    "/password/reset",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Réinitialisation du mot de passe",
)
async def reset_password(
    payload: PasswordResetRequest,
    request: Request,
    service: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    """Apply new password using valid reset token and revoke active sessions."""
    ip = get_client_ip(request)
    await service.reset_password(
        token_str=payload.token,
        new_password=payload.new_password,
        ip_address=ip,
    )
    return MessageResponse(message="Votre mot de passe a été modifié avec succès.")


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rafraîchissement des jetons",
)
async def refresh_token(
    payload: TokenRefreshRequest,
    service: IdentityService = Depends(get_identity_service),
) -> TokenResponse:
    """Rotate refresh token and issue new 15-minute access token."""
    return await service.refresh_access_token(refresh_token_str=payload.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Déconnexion",
)
async def logout(
    payload: LogoutRequest,
    service: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    """Revoke refresh token session."""
    await service.revoke_refresh_token(refresh_token_str=payload.refresh_token)
    return MessageResponse(message="Déconnexion effectuée avec succès.")


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Profil de l'utilisateur connecté",
)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserProfileResponse:
    """Return identity and roles profile of current authenticated user."""
    repo = IdentityRepository(db)
    roles = await repo.get_user_role_codes(user.id)
    profile = await repo.get_caregiver_profile(user.id)
    is_verified_caregiver = (
        profile.verification_status == "approved" if profile else False
    )

    return UserProfileResponse(
        id=user.id,
        display_name=user.display_name,
        language=user.language,
        status=user.status,
        roles=roles,
        is_verified_caregiver=is_verified_caregiver,
    )
