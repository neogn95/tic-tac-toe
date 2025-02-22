// Copyright 2020 The Nakama Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/heroiclabs/nakama-common/runtime"
	"github.com/heroiclabs/nakama-project-template/api"
	"google.golang.org/protobuf/encoding/protojson"
)

type nakamaRpcFunc func(context.Context, runtime.Logger, *sql.DB, runtime.NakamaModule, string) (string, error)

func rpcFindMatch(marshaler *protojson.MarshalOptions, unmarshaler *protojson.UnmarshalOptions) nakamaRpcFunc {
	return func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
		logger.Info("Entered rpcFindMatch")

		matchIDs := make([]string, 0, 10)

		_, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
		if !ok {
			return "", errNoUserIdFound
		}

		request := &api.RpcFindMatchRequest{}
		if err := unmarshaler.Unmarshal([]byte(payload), request); err != nil {
			return "Error unmarshalling the payload", errUnmarshal
		}

		var fast int
		if request.Fast {
			fast = 1
		}

		query := fmt.Sprintf("+label.open:1 +label.fast:%d", fast)

		matches, err := nk.MatchList(ctx, 10, true, "", nil, nil, query) // Allow any match that is open
		if err != nil {
			logger.Error("error listing matches: %v", err)
			return "", errInternalError
		}

		if len(matches) > 0 {
			logger.Info("Found an existing match to join")
			matchIDs = append(matchIDs, matches[0].MatchId) // Join the first available match
		} else {
			logger.Info("No available matches, creating a new one")
			matchID, err := nk.MatchCreate(ctx, moduleName, map[string]interface{}{"fast": fast})
			if err != nil {
				logger.Error("error creating match: %v", err)
				return "", errInternalError
			}
			matchIDs = append(matchIDs, matchID)
		}

		response, err := marshaler.Marshal(&api.RpcFindMatchResponse{MatchIds: matchIDs})
		if err != nil {
			logger.Error("error marshaling response payload: %v", err.Error())
			return "", errMarshal
		}

		return string(response), nil
	}
}
