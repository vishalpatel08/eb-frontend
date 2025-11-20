import WebSocket from 'ws';
import axios from 'axios';

const API = 'http://localhost:4000';
const WS = 'ws://localhost:4000/ws';

function connect(userId) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS}?userId=${userId}`);
    ws.on('open', () => {
      console.log(`[${userId}] ws open`);
      resolve(ws);
    });
    ws.on('message', (data) => {
      console.log(`[${userId}] received ws message:`, data.toString());
    });
    ws.on('close', () => console.log(`[${userId}] ws closed`));
    ws.on('error', (e) => console.error(`[${userId}] ws error`, e.message));
  });
}

(async () => {
  try {
    const userA = 'test-user-A';
    const userB = 'test-user-B';

    const wsA = await connect(userA);
    const wsB = await connect(userB);

    console.log('Both websockets connected. Posting a message from A to B via HTTP POST');

    const payload = {
      senderId: userA,
      receiverId: userB,
      content: 'Hello from scripted test ' + Date.now()
    };

    const res = await axios.post(`${API}/api/messages`, payload).catch(err => {
      console.error('POST error', err.message, err.response && err.response.data);
      return null;
    });

    console.log('POST response status:', res && res.status, 'data:', res && res.data);

    // wait a bit to receive messages
    await new Promise(r => setTimeout(r, 1500));

    wsA.close();
    wsB.close();
  } catch (e) {
    console.error('Test script error', e);
  }
})();
