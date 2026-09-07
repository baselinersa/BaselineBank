from django.urls import path, include

from accounts.admin import baseline_admin_site

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [

    # =========================================================
    # BASELINE BANK ADMIN
    # =========================================================

    path(
        "admin/",
        baseline_admin_site.urls
    ),


    # =========================================================
    # JWT LOGIN
    # =========================================================

    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),


    # =========================================================
    # BANKING API
    # =========================================================

    path(
        "api/",
        include("accounts.urls"),
    ),

]