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
	"time"

	"github.com/heroiclabs/nakama-common/runtime"
	"google.golang.org/protobuf/encoding/protojson"
)

var (
	errInternalError = runtime.NewError("internal server error", 13) // INTERNAL
	errMarshal       = runtime.NewError("cannot marshal type", 13)   // INTERNAL
	errNoUserIdFound = runtime.NewError("no user ID in context", 3)  // INVALID_ARGUMENT
	errUnmarshal     = runtime.NewError("cannot unmarshal type", 13) // INTERNAL
)

const (
	rpcIdFindMatch = "find_match"
)

// noinspection GoUnusedExportedFunction
func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	initStart := time.Now()

	marshaler := &protojson.MarshalOptions{
		UseEnumNumbers: true,
	}
	unmarshaler := &protojson.UnmarshalOptions{
		DiscardUnknown: false,
	}

	if err := initializer.RegisterRpc(rpcIdFindMatch, rpcFindMatch(marshaler, unmarshaler)); err != nil {
		logger.Info("Unable to register rpc function: %v", err)
		return err
	}

	logger.Info("rpc function registered successfully")

	if err := initializer.RegisterMatch(moduleName, func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
		return &MatchHandler{
			marshaler:   marshaler,
			unmarshaler: unmarshaler,
		}, nil
	}); err != nil {
		logger.Info("Error registering Macth: %v", err)
		return err
	}

	if err := nk.LeaderboardCreate(ctx, "xoxo_leaderboard", true, "descending", "best", "", nil, false); err != nil {
		logger.Error("Error creating leaderboard: %v", err)
		return err
	}

	if err := registerSessionEvents(db, nk, initializer); err != nil {
		return err
	}

	logger.Info("Plugin loaded in '%d' msec.", time.Since(initStart).Milliseconds())
	return nil
}
