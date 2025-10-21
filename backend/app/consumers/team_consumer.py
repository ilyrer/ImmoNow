"""
Team WebSocket Consumer
Live activity feed and presence tracking for team collaboration
"""
import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from app.db.models import UserPresence, UserProfile, Task, Property, Appointment
from app.core.security import decode_token
from app.core.errors import NotFoundError
from datetime import datetime, timedelta

User = get_user_model()


class TeamConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for team activity feed and presence tracking"""
    
    async def connect(self):
        """Connect to Team WebSocket"""
        self.tenant_id = self.scope['url_route']['kwargs']['tenant_id']
        self.room_group_name = f'team_{self.tenant_id}'
        
        # Extract token from query params
        query_string = self.scope['query_string'].decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if not token:
            await self.close(code=4001)  # Custom close code for missing token
            return
        
        try:
            # Decode token to get user info
            payload = decode_token(token)
            self.user_id = payload['user_id']
            self.user_tenant_id = payload['tenant_id']
            
            # Verify token is not expired
            if 'exp' in payload:
                import time
                if payload['exp'] < time.time():
                    await self.close(code=4002)  # Custom close code for expired token
                    return
            
            # Verify tenant access
            if self.user_tenant_id != self.tenant_id:
                await self.close(code=4004)  # Custom close code for tenant mismatch
                return
                
        except Exception as e:
            print(f"Token decode error: {e}")
            await self.close(code=4003)  # Custom close code for invalid token
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Set user presence
        await self.set_user_presence('online')
        
        # Send initial data
        await self.send_initial_data()
    
    async def disconnect(self, close_code):
        """Disconnect from WebSocket"""
        # Set user presence to offline
        await self.set_user_presence('offline')
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'activity.created':
                await self.handle_activity_created(data)
            elif message_type == 'presence.update':
                await self.handle_presence_update(data)
            elif message_type == 'team.metrics.update':
                await self.handle_team_metrics_update(data)
            elif message_type == 'member.status.change':
                await self.handle_member_status_change(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            print(f"Error processing message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def handle_activity_created(self, data):
        """Handle new activity creation"""
        activity = data.get('activity', {})
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'activity_created_broadcast',
                'activity': activity,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_presence_update(self, data):
        """Handle presence status update"""
        status = data.get('status', 'online')
        
        # Update user presence
        await self.set_user_presence(status)
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_updated_broadcast',
                'user_id': self.user_id,
                'status': status,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_team_metrics_update(self, data):
        """Handle team metrics update"""
        metrics = data.get('metrics', {})
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'team_metrics_updated_broadcast',
                'metrics': metrics,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    async def handle_member_status_change(self, data):
        """Handle member status change"""
        member_id = data.get('member_id')
        status = data.get('status')
        
        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'member_status_changed_broadcast',
                'member_id': member_id,
                'status': status,
                'user_id': self.user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    
    # Broadcast handlers
    async def activity_created_broadcast(self, event):
        """Broadcast activity created event"""
        await self.send(text_data=json.dumps({
            'type': 'activity.created',
            'activity': event['activity'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def presence_updated_broadcast(self, event):
        """Broadcast presence updated event"""
        await self.send(text_data=json.dumps({
            'type': 'presence.updated',
            'user_id': event['user_id'],
            'status': event['status'],
            'timestamp': event['timestamp']
        }))
    
    async def team_metrics_updated_broadcast(self, event):
        """Broadcast team metrics updated event"""
        await self.send(text_data=json.dumps({
            'type': 'team.metrics.updated',
            'metrics': event['metrics'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def member_status_changed_broadcast(self, event):
        """Broadcast member status changed event"""
        await self.send(text_data=json.dumps({
            'type': 'member.status.changed',
            'member_id': event['member_id'],
            'status': event['status'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
    
    async def send_initial_data(self):
        """Send initial data when connecting"""
        try:
            # Get current user info
            user = await self.get_user()
            if user:
                # Get online users
                online_users = await self.get_online_users()
                
                # Get recent activities
                recent_activities = await self.get_recent_activities()
                
                await self.send(text_data=json.dumps({
                    'type': 'connection.established',
                    'user': {
                        'id': str(user.id),
                        'name': f"{user.first_name} {user.last_name}",
                        'avatar': getattr(user.profile, 'avatar', None)
                    },
                    'online_users': online_users,
                    'recent_activities': recent_activities,
                    'timestamp': datetime.utcnow().isoformat()
                }))
        except Exception as e:
            print(f"Error sending initial data: {e}")
    
    @database_sync_to_async
    def get_user(self):
        """Get current user"""
        try:
            return User.objects.get(id=self.user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def set_user_presence(self, status):
        """Set user presence status"""
        try:
            user = User.objects.get(id=self.user_id)
            presence, created = UserPresence.objects.get_or_create(
                user=user,
                defaults={'status': status, 'last_seen': datetime.utcnow()}
            )
            if not created:
                presence.status = status
                presence.last_seen = datetime.utcnow()
                presence.save()
        except Exception as e:
            print(f"Error setting user presence: {e}")
    
    @database_sync_to_async
    def get_online_users(self):
        """Get list of online users"""
        try:
            online_users = UserPresence.objects.filter(
                status='online',
                last_seen__gte=datetime.utcnow() - timedelta(minutes=5)
            ).select_related('user')
            
            return [
                {
                    'id': str(presence.user.id),
                    'name': f"{presence.user.first_name} {presence.user.last_name}",
                    'avatar': getattr(presence.user.profile, 'avatar', None),
                    'last_seen': presence.last_seen.isoformat(),
                    'status': presence.status
                }
                for presence in online_users
            ]
        except Exception as e:
            print(f"Error getting online users: {e}")
            return []
    
    @database_sync_to_async
    def get_recent_activities(self):
        """Get recent team activities"""
        try:
            activities = []
            
            # Get recent tasks
            recent_tasks = Task.objects.filter(
                tenant_id=self.tenant_id
            ).select_related('assignee', 'created_by').order_by('-updated_at')[:10]
            
            for task in recent_tasks:
                activities.append({
                    'id': f"task_{task.id}",
                    'type': 'task_updated',
                    'title': f"Task '{task.title}' updated",
                    'description': f"Status: {task.status}",
                    'member_id': str(task.assignee.id),
                    'member_name': f"{task.assignee.first_name} {task.assignee.last_name}",
                    'member_avatar': getattr(task.assignee.profile, 'avatar', None),
                    'timestamp': task.updated_at.isoformat(),
                    'metadata': {
                        'task_id': str(task.id),
                        'status': task.status,
                        'priority': task.priority
                    }
                })
            
            # Get recent properties
            recent_properties = Property.objects.filter(
                tenant_id=self.tenant_id
            ).select_related('created_by').order_by('-updated_at')[:5]
            
            for property_obj in recent_properties:
                activities.append({
                    'id': f"property_{property_obj.id}",
                    'type': 'property_updated',
                    'title': f"Property '{property_obj.title}' updated",
                    'description': f"Status: {property_obj.status}",
                    'member_id': str(property_obj.created_by.id),
                    'member_name': f"{property_obj.created_by.first_name} {property_obj.created_by.last_name}",
                    'member_avatar': getattr(property_obj.created_by.profile, 'avatar', None),
                    'timestamp': property_obj.updated_at.isoformat(),
                    'metadata': {
                        'property_id': str(property_obj.id),
                        'status': property_obj.status,
                        'price': property_obj.price
                    }
                })
            
            # Get recent appointments
            recent_appointments = Appointment.objects.filter(
                tenant_id=self.tenant_id
            ).select_related('created_by').order_by('-created_at')[:5]
            
            for appointment in recent_appointments:
                activities.append({
                    'id': f"appointment_{appointment.id}",
                    'type': 'appointment_created',
                    'title': f"Appointment '{appointment.title}' scheduled",
                    'description': f"Time: {appointment.start_time.strftime('%H:%M')}",
                    'member_id': str(appointment.created_by.id),
                    'member_name': f"{appointment.created_by.first_name} {appointment.created_by.last_name}",
                    'member_avatar': getattr(appointment.created_by.profile, 'avatar', None),
                    'timestamp': appointment.created_at.isoformat(),
                    'metadata': {
                        'appointment_id': str(appointment.id),
                        'start_time': appointment.start_time.isoformat(),
                        'location': appointment.location
                    }
                })
            
            # Sort by timestamp and return most recent
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            return activities[:20]  # Return top 20 activities
            
        except Exception as e:
            print(f"Error getting recent activities: {e}")
            return []
    
    @database_sync_to_async
    def get_team_stats(self):
        """Get current team statistics"""
        try:
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=7)
            
            # Count active members
            active_members = UserProfile.objects.filter(
                tenant_id=self.tenant_id,
                is_active=True
            ).count()
            
            # Count tasks completed today
            tasks_today = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='done',
                updated_at__gte=today_start
            ).count()
            
            # Count tasks completed this week
            tasks_week = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='done',
                updated_at__gte=week_start
            ).count()
            
            # Count active properties
            active_properties = Property.objects.filter(
                tenant_id=self.tenant_id,
                status='active'
            ).count()
            
            # Count upcoming appointments
            upcoming_appointments = Appointment.objects.filter(
                tenant_id=self.tenant_id,
                start_time__gte=now
            ).count()
            
            return {
                'active_members': active_members,
                'tasks_completed_today': tasks_today,
                'tasks_completed_week': tasks_week,
                'active_properties': active_properties,
                'upcoming_appointments': upcoming_appointments,
                'timestamp': now.isoformat()
            }
            
        except Exception as e:
            print(f"Error getting team stats: {e}")
            return {}
