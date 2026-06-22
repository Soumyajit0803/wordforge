## Main workflow
- Two players: Challenger(the one who starts) and opponent(who accepts)
- A challenge is said to be `locked` if any opponent accepts it by setting a word for the challenger
- [PENDING] others can also view the status of any challenge.
- If either of the player is a guest, the challenge result won't be saved in tables other than `challenges` table.
- Leaderboard is a separate table which gets updated every time a challenge ends and both the players are registered users.
- [PENDING] Prompt the guest to register on finishing every challenge to sign up, doing which the current challenge will become the first challenge of him as a registered user.

## Challenge status:
1. Guest to guest challenges working
    - No need to have a way to view guest match results since they are anyways getting stored in database. We MUST delete all guest challenges within 24hrs.
2. Account to Account challenges working
3. Account to guest challenge working
    - Made a middleware that will check for guest profile and if not existing, creates one.
4. Guest to account: working

## Future important works:
1. `Current streak` not working as usual. [FIXED]
2. `status` variable needs to be scrapped from database, or its implementation needs a major fix [SCRAPPED]
3. Need to fix the status page for those who are neither challenger nor opponent. [FIXED]
4. Refactor large files to remove useless code
5. Change the format of ID for guest users to remove any whitespaces.

## Future casual works:
1. Provide a link from challenge creation page to go to status/[id] from where user can go to play area.
2. Provide a refresh button over the opponent card to refetch the opponent attempts

## Questions:
1. If atleast one player is guest, should we update the user_stats at all? That would actually open a loophole to achieve good results when registered user manipulates the guest/acts as the guest opponent. ANSWER: NO
2. Save progress: Why not save the progress if I am already saving the challenge ID of the challenge, irrespective of the type of challenge? ANSWER: No need, guest profile only exists in the browser. If the cookies ever get deleted from browser, the guest is forgotten forever. So should be the game progress.[Need validation but almost sure]

3. Do I need the match_results table? Fr? ANSWER: NO. Just remove it.[PRIORITY][DONE]

