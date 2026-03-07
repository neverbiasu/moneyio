from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import User


# 注册
def register_user(username, email, password):

    user = User.objects.create(
        username=username,
        email=email,
        password=make_password(password)
    )

    return user


# 登录
def authenticate_user(username, password):

    user = authenticate(username=username, password=password)

    return user


# 修改密码
def update_password(user, new_password):

    user.password = make_password(new_password)
    user.save()

    return user