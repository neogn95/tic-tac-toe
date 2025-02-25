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
	"encoding/json"
	"fmt"
	"time"

	"github.com/heroiclabs/nakama-common/runtime"
	"github.com/heroiclabs/nakama-project-template/api"
	"google.golang.org/protobuf/encoding/protojson"
)

type nakamaRpcFunc func(context.Context, runtime.Logger, *sql.DB, runtime.NakamaModule, string) (string, error)

var fast int
var matchTypeKey string

func rpcFindMatch(marshaler *protojson.MarshalOptions, unmarshaler *protojson.UnmarshalOptions) nakamaRpcFunc {
	return func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
		logger.Info("Entered rpcFindMatch")

		matchIDs := make([]string, 0, 10)

		userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
		if !ok {
			return "", errNoUserIdFound
		}

		request := &api.RpcFindMatchRequest{}
		if err := unmarshaler.Unmarshal([]byte(payload), request); err != nil {
			return "Error unmarshalling the payload", errUnmarshal
		}

		if request.Fast {
			fast = 1
		}

		// Two-step process: First look for matches, then create if needed
		// Step 1: Look for existing matches first
		query := fmt.Sprintf("+label.open:1 +label.fast:%d", fast)

		// Try finding a match first - most of the time this will succeed
		matches, err := nk.MatchList(ctx, 10, true, "", nil, nil, query)
		if err != nil {
			logger.Error("error listing matches: %v", err)
			return "", errInternalError
		}

		if len(matches) > 0 {
			logger.Info("Found an existing match to join")
			matchIDs = append(matchIDs, matches[0].MatchId) // Join the first available match
		} else {
			// Step 2: No matches found, we need coordination for creating a new one

			// Generate a consistent key for this match type
			matchTypeKey := fmt.Sprintf("match_lock_fast_%d", fast)

			// Use a counter approach - each player tries to increment a counter
			// Player who gets the counter at 1 creates the match

			// First get the current counter value
			objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{
				{
					Collection: "match_counters",
					Key:        matchTypeKey,
					UserID:     "", // System-owned object
				},
			})

			var counter int64 = 0
			var version string = "*" // Default to "create if not exists"

			// If the counter exists, get its current value and version
			if err == nil && len(objects) > 0 {
				var counterObj map[string]interface{}
				err := json.Unmarshal([]byte(objects[0].Value), &counterObj)
				if err == nil {
					if val, ok := counterObj["count"].(float64); ok {
						counter = int64(val)
					}
					version = objects[0].Version
				}
			}

			// Increment the counter
			counter++
			counterObj := map[string]interface{}{
				"count":     counter,
				"last_user": userID,
			}

			counterJSON, _ := json.Marshal(counterObj)

			// Try to write the new counter value
			writeResult, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{
				{
					Collection:      "match_counters",
					Key:             matchTypeKey,
					UserID:          "", // System-owned
					Value:           string(counterJSON),
					Version:         version,
					PermissionRead:  2, // Public read
					PermissionWrite: 0, // Only server can write
				},
			})

			// If write was successful and we got counter = 1, we create the match
			if err == nil && len(writeResult) > 0 && counter == 1 {
				logger.Info("Creating new match as first requester")
				matchID, err := nk.MatchCreate(ctx, moduleName, map[string]interface{}{"fast": fast})
				if err != nil {
					logger.Error("error creating match: %v", err)
					return "", errInternalError
				}
				matchIDs = append(matchIDs, matchID)
			} else {
				// We weren't the first - wait a short time then look for matches again
				logger.Info("Waiting for another player to create match")
				time.Sleep(400 * time.Millisecond)

				// Try again to find matches
				matches, err := nk.MatchList(ctx, 10, true, "", nil, nil, query)
				if err != nil {
					logger.Error("error listing matches on retry: %v", err)
					return "", errInternalError
				}

				if len(matches) > 0 {
					logger.Info("Found match on retry")
					matchIDs = append(matchIDs, matches[0].MatchId)
				} else {
					// Still no match, create as fallback
					logger.Info("No match found after waiting, creating fallback")
					matchID, err := nk.MatchCreate(ctx, moduleName, map[string]interface{}{"fast": fast})
					if err != nil {
						logger.Error("error creating fallback match: %v", err)
						return "", errInternalError
					}
					matchIDs = append(matchIDs, matchID)
				}
			}
		}

		response, err := marshaler.Marshal(&api.RpcFindMatchResponse{MatchIds: matchIDs})
		if err != nil {
			logger.Error("error marshaling response payload: %v", err.Error())
			return "", errMarshal
		}

		// Reset the counter after a delay
		// This allows the counter to be reused for future match creation
		if fast == 1 {
			// For fast matches, reset counter more quickly
			go func() {
				time.Sleep(5 * time.Second)
				deleteCounter(nk, matchTypeKey)
			}()
		} else {
			// For regular matches, wait longer before resetting
			go func() {
				time.Sleep(30 * time.Second)
				deleteCounter(nk, matchTypeKey)
			}()
		}

		return string(response), nil
	}
}

// Helper function to delete the counter
func deleteCounter(nk runtime.NakamaModule, key string) {
	ctx := context.Background()
	nk.StorageDelete(ctx, []*runtime.StorageDelete{
		{
			Collection: "match_counters",
			Key:        key,
			UserID:     "",
		},
	})
}
