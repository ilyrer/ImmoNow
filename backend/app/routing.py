"""
WebSocket URL routing for communications, kanban, and team
"""
from django.urls import re_path
from app.consumers.chat_consumer import ChatConsumer
from app.consumers.kanban_consumer import KanbanConsumer
from app.consumers.team_consumer import TeamConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>[^/]+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/kanban/(?P<tenant_id>[^/]+)/$', KanbanConsumer.as_asgi()),
    re_path(r'ws/team/(?P<tenant_id>[^/]+)/$', TeamConsumer.as_asgi()),
]
