import asyncio
import json
import logging
from typing import Dict, Set

logger = logging.getLogger("medinexus.sse_service")

class SSEManager:
    def __init__(self):
        # hospital_id -> Set of asyncio Queues
        self._hospital_subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # Set of asyncio Queues for global patient portal updates
        self._global_patient_subscribers: Set[asyncio.Queue] = set()

    async def subscribe_hospital(self, hospital_id: str) -> asyncio.Queue:
        if hospital_id not in self._hospital_subscribers:
            self._hospital_subscribers[hospital_id] = set()
        q = asyncio.Queue()
        self._hospital_subscribers[hospital_id].add(q)
        logger.info(f"New SSE subscription for hospital node: {hospital_id}")
        return q

    def unsubscribe_hospital(self, hospital_id: str, q: asyncio.Queue):
        if hospital_id in self._hospital_subscribers:
            self._hospital_subscribers[hospital_id].discard(q)

    async def subscribe_global_patient(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._global_patient_subscribers.add(q)
        logger.info("New SSE subscription for global patient portal")
        return q

    def unsubscribe_global_patient(self, q: asyncio.Queue):
        self._global_patient_subscribers.discard(q)

    async def broadcast_hospital_event(self, hospital_id: str, event_type: str, data: dict):
        if hospital_id in self._hospital_subscribers:
            msg = json.dumps({"type": event_type, "data": data})
            for q in list(self._hospital_subscribers[hospital_id]):
                await q.put(msg)

    async def broadcast_global_event(self, event_type: str, data: dict):
        msg = json.dumps({"type": event_type, "data": data})
        for q in list(self._global_patient_subscribers):
            await q.put(msg)

sse_manager = SSEManager()
