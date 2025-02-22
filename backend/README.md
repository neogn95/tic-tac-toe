Nakama Tic Tac Toe
===

> A project to set up custom logic for tic tac toe game in Nakama server.

For more documentation have a look at:

* https://heroiclabs.com/docs/nakama/server-framework/introduction/index.html
* https://heroiclabs.com/docs/nakama/concepts/storage/
* https://heroiclabs.com/docs/nakama/concepts/user-accounts/#virtual-wallet
* https://heroiclabs.com/docs/nakama/concepts/notifications/
* https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/

### Prerequisites

The codebase requires these development tools:

* Go compiler and runtime: 1.15.2 or greater.
* Docker Engine: 19.0.0 or greater.

### Go Dependencies

The project uses Go modules which should be vendored as normal:

```shell
env GO111MODULE=on GOPRIVATE="github.com" go mod vendor
```

### Keys

In local.yml, the admin key and password are stored as environment variables. To set them:

In a Linux/Unix-based system:
`export ADMIN_USERNAME="your_admin_username"
export ADMIN_PASSWORD="your_admin_password"`

On Windows:
`set ADMIN_USERNAME=your_admin_username
set ADMIN_PASSWORD=your_admin_password`

### Start

The recommended workflow is to use Docker and the compose file to build and run the game server, database resources.

```shell
docker-compose up --build nakama
```

### Recompile / Run

When the containers have been started as shown above you can replace just the game server custom code and recompile it with the `-d` option.

```shell
docker-compose up -d --build nakama
```

### Stop

To stop all running containers you can use the Docker compose sub-command.

```shell
docker-compose down
```

You can wipe the database and workspace with `docker-compose down -v` to remove the disk volumes.

### Run RPC function

A bunch of RPC IDs are registered with the server logic. A couple of these are:

* "rewards" in Go or as "reward" in Lua.
* "refreshes" in Go or as "refresh" in Lua.

To execute the RPC function with cURL generated a session token:

```shell
curl "127.0.0.1:7350/v2/account/authenticate/device" --data "{\"id\": \""$(uuidgen)"\"}" --user 'defaultkey:'
```

Take the session token in the response and use it to execute the RPC function as the user:

```shell
curl "127.0.0.1:7350/v2/rpc/rewards" -H 'Authorization: Bearer $TOKEN' --data '""'
```

This will generate an RPC response on the initial response in that day and grant no more until the rollover.

```
{"payload":"{\"coins_received\":500}"}
or
{"payload":"{\"coins_received\":0}"}
```

You can also skip the cURL steps and use the [Nakama Console's API Explorer](http://127.0.0.1:7351/apiexplorer) to execute the RPCs.

### Authoritative Multiplayer

The authoritative multiplayer example includes a match handler that defines game logic, and an RPC function players should call to find a match they can join or have the server create one for them if none are available.

Running the match finder RPC function registered as RPC ID "find_match" returns one or more match IDs that fit the user's criteria:

```shell
curl "127.0.0.1:7350/v2/rpc/find_match" -H 'Authorization: Bearer $TOKEN' --data '"{}"'
```

This will return one or more match IDs:

```
{"payload":"{\"match_ids\":[\"match ID 1\","match ID 2\",\"...\"]}"}
```

To join one of these matches check our [matchmaker documentation](https://heroiclabs.com/docs/nakama/concepts/multiplayer/matchmaker/#join-a-match).
