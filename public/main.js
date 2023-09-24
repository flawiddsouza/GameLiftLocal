import { createApp } from 'vue'

const ws = new WebSocket('ws://localhost:9001');

ws.onopen = () => {
  console.log('WebSocket Connected');
}

ws.onmessage = (event) => {
  console.log('WebSocket Message:', event.data);
}

ws.onclose = () => {
  console.log('WebSocket Closed');
}

const app = createApp({
  template: /*html*/ `
    <div class="m-1rem">
      <h1>Create Game Session</h1>
      <form class="mt-1rem" @submit.prevent="createGameSession">
        <table>
          <thead>
            <tr>
              <th>Game Property Key</th>
              <th>Game Property Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gameProperty in gameProperties">
              <td><input type="text" v-model="gameProperty.key" required></td>
              <td><input type="text" v-model="gameProperty.value" required></td>
              <td><button type="button" @click="gameProperties.splice(gameProperties.indexOf(gameProperty), 1)">Remove</button></td>
            </tr>
            <tr>
              <td colspan="2">
                <button type="button" class="w-100p" @click="addGameProperty">Add Game Property</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="mt-1rem">
          <h3>Player Sessions</h3>
          <table class="mt-1rem">
            <thead>
              <tr>
                <th>Player ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="playerSession in playerSessions">
                <td><input type="text" v-model="playerSession.playerId" required></td>
                <td><input type="text" v-model="playerSession.playerData"></td>
                <td><button type="button" @click="playerSessions.splice(playerSessions.indexOf(playerSession), 1)">Remove</button></td>
              </tr>
              <tr>
                <td colspan="2">
                  <button type="button" class="w-100p" @click="addPlayerSession">Add Player Session</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-1rem">
          <button type="submit" >Create Game Session</button>
        </div>
      </form>
    </div>
  `,
  data() {
    return {
      gameProperties: [
        { key: '', value: ''}
      ],
      playerSessions: [
        { playerId: '', playerData: '' }
      ]
    }
  },
  watch: {
    gameProperties: {
      deep: true,
      handler() {
        localStorage.setItem('GameLiftLocal-gameProperties', JSON.stringify(this.gameProperties));
      }
    },
    playerSessions: {
      deep: true,
      handler() {
        localStorage.setItem('GameLiftLocal-playerSessions', JSON.stringify(this.playerSessions));
      }
    }
  },
  methods: {
    addGameProperty() {
      this.gameProperties.push({ key: '', value: '' });
    },
    addPlayerSession() {
      this.playerSessions.push({ playerId: '' });
    },
    createGameSession() {
      ws.send(JSON.stringify({
        Action: 'CreateGameSession',
        RequestId: crypto.randomUUID(),
        GameProperties: this.gameProperties.map(({ key, value }) => ({ [key]: value })).reduce((a, b) => ({ ...a, ...b }), {}),
        PlayerSessions: this.playerSessions,
      }));
    }
  },
  mounted() {
    const gameProperties = localStorage.getItem('GameLiftLocal-gameProperties');
    if (gameProperties) {
      this.gameProperties = JSON.parse(gameProperties);
    }

    const playerSessions = localStorage.getItem('GameLiftLocal-playerSessions');
    if (playerSessions) {
      this.playerSessions = JSON.parse(playerSessions);
    }
  }
});

app.mount('#app');
