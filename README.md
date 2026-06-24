## Main workflow
- Two players: Challenger(the one who starts) and opponent(who accepts)
- A challenge is said to be `locked` if any opponent accepts it by setting a word for the challenger
- [PENDING] others can also view the status of any challenge.
- If either of the player is a guest, the challenge result won't be saved in tables other than `challenges` table.
- Leaderboard is a separate table which gets updated every time a challenge ends and both the players are registered users.
- [PENDING] Prompt the guest to register on finishing every challenge to sign up, doing which the current challenge will become the first challenge of him as a registered user. [DONE][PENDING MORE TESTS]

## UI works:
1. Do better on popup showing game status on game over
2. Change the overall theme color to black

