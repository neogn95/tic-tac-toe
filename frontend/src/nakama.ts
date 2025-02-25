import { Client } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";
import { useGameStore } from "./store";

class Nakama {
    private client: Client;
    private session: any;
    public socket: any;
    private matches: any;
    private useSSL: boolean = false;

    constructor() {
        const serverKey = import.meta.env.VITE_NAKAMA_KEY || "defaultkey";
        const host = import.meta.env.VITE_NAKAMA_HOST || "localhost";
        const port = import.meta.env.VITE_NAKAMA_PORT || "7350";
        this.useSSL = import.meta.env.VITE_NAKAMA_SSL === "true";

        console.log('Nakama config:', { serverKey, host, port, useSSL: this.useSSL }); 

        this.client = new Client(serverKey, host, port, this.useSSL);
    }

    async authenticate(username: string) {
        const store = useGameStore.getState();
        let deviceId = store.deviceId;
        if (!deviceId) {
            deviceId = uuidv4();
            store.setDeviceId(deviceId);
        }

        console.log(`username: ${username}`);
        this.session = await this.client.authenticateCustom(deviceId, true, username);
        store.setUsername(username);
        store.setUserId(this.session.user_id);
        store.setSessionToken(this.session.token);

        const trace = true;
        this.socket = this.client.createSocket(this.useSSL, trace);

        await this.socket.connect(this.session);
    }

    joinOrCreateMatch = async () => {
        const rpcid = "find_match";
        const store = useGameStore.getState();
        let matchId: string | undefined;
        let match;
        let connectedOpponents;

        const fast = store.fastGameMode;

        if (!this.session) {
            const username = store.username;
            if (username) {
                await this.authenticate(username);
            }
        }
        else{
            this.isSessionExpired();
        }

        // First try to find an open match
        console.log(`{"fast":${fast ? 1 : 0}}`);
        const matches = await this.client.listMatches(this.session, 1, true, `+label.open:1 +label.fast:${fast ? 1 : 0}`, 1, 2);

        console.log(matches);

        if (matches.matches && matches.matches.length > 0) {
            // Join an existing match
            matchId = matches.matches[0].match_id;
            match = await this.socket.joinMatch(matchId);
        } else {
            const fast = store.fastGameMode;
            this.matches = await this.client.rpc(this.session, rpcid, { fast: fast });
            matchId = this.matches.payload.matchIds[0];

            match = await this.socket.joinMatch(matchId);
        }

        // Store the match ID and continue with game setup
        if(matchId) store.setMatchId(matchId);

        
        if (match && match.presences) {
            connectedOpponents = match.presences.filter((presence: any) => {
                return presence.user_id != match.self.user_id;
            });

            if (connectedOpponents && connectedOpponents.length > 0) {
                connectedOpponents.forEach((opponent: any) => {
                    console.log("User id %o, username %o.", opponent.user_id, opponent.username);
                });

                store.setOppUsername(connectedOpponents[0].username);
            }
        }

        console.log("Match joined!");
        return connectedOpponents;
    };

    async reconnectMatch() {
        const store = useGameStore.getState();
        const username = store.username;
        if (username) {
            await this.authenticate(username);
        }

        const matchId = store.matchId;
        if (matchId) {
            const match = await this.socket.joinMatch(matchId);
            console.log("Rejoined match:", match.match_id);
        }
    }

    async makeMove(index: number) {
        const store = useGameStore.getState();
        const matchId = store.matchId;
        if (matchId) {
            const data = { "position": index };
            await this.socket.sendMatchState(matchId, 4, JSON.stringify(data));
            console.log("Match data sent");
        }
    }

    async getLeaderBoard() {
        const leaderboardId = "xoxo_leaderboard";

        if (!this.session) {
            await this.isSessionExpired();
        }

        return await this.client.listLeaderboardRecords(
            this.session,
            leaderboardId,
            undefined,
            10
        );
    }

    async isSessionExpired() {
        const store = useGameStore.getState();
        if (!this.session) {
            const username = store.username;
            if (username) {
                await this.authenticate(username);
            }
            return;
        }

        if (this.session.isexpired(Date.now() + 1)) {
            try {
                // Attempt to refresh the existing session.
                this.session = await this.client.sessionRefresh(this.session);
                store.setSessionToken(this.session.token);
            } catch (error) {
                // Couldn't refresh the session so reauthenticate.
                console.log(error);
                const username = store.username;
                if (username) {
                    await this.authenticate(username);
                }
            }
        }
    }
}

export default new Nakama();
