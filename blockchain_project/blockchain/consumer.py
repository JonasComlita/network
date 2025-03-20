import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BlockConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("blocks", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("blocks", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Handle incoming data if needed

    async def send_block_update(self, event):
        await self.send(text_data=json.dumps(event))

class TransactionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("transactions", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("transactions", self.channel_name)

    async def send_transaction_update(self, event):
        await self.send(text_data=json.dumps(event))
