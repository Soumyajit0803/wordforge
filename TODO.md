## Main workflow
- Two players: Challenger(the one who starts) and opponent(who accepts)
- A challenge is said to be `locked` if any opponent accepts it by setting a word for the challenger
- [PENDING] others can also view the status of any challenge.
- If either of the player is a guest, the challenge result won't be saved in tables other than `challenges` table.
- Leaderboard is a separate table which gets updated every time a challenge ends and both the players are registered users.
- [PENDING] Prompt the guest to register on finishing every challenge to sign up, doing which the current challenge will become the first challenge of him as a registered user. [DONE][PENDING MORE TESTS]

## Pending works:
1. Do better on popup showing game status on game over
2. Change the overall theme color to black
3. Create challenge button on /challenges/create
4. BUG: Opponent played, I have not. Yet the challenge history shown red mark for opponent.
5. Better logic needed for efficiencyIQ calculate
6. [NEW UI]: Keep a live IQ calculator as I hit my guesses
7. [POSSIBLE BUG]: What if user creates challenge, then logs out, then plays in the same browser as guest, and then does a login with google to become the opponent as well?
8. [TESTING]: All scenarios of `sign in with google` after playing game remaining. Although highly likely its perfect.

## Evaluation logic
Penalise for undesirable result. Award bonus for a better guess

```
iq = 0
penalty = 0

knownDeadLetters = set()
knownGreenLetters = set()
knownYellowSpots = dictionary_of_sets()

for guess of guesses:
    deduction = 0
    finish = 0
    discoveryBonus = 0 
    
    result = create_evaluation_array()
    for `x`, `idx` in enum(guess):
        color = result[idx]
        if (color==GREEN):
            finish += 1
            if(!knownGreenLetters.has(x)) discoveryBonus += 1
        else if (color==YELLOW):
            spots = knownYellowSpots.get(x)
            if(spots.has(idx)): deduction += 1
            else if knownGreenLetters.has(x): deduction += 2

            if(!spots): discoveryBonus += 1
        else if(color==GREY):
            if(knownDeadLetters.has(x)): deduction += 1
    
    update_state_for_this_turn()

    iq -= penalty+deduction
    penalty = 15

    if(finish==5): break

    iq += discoveryBonus

if(PLAYER_LOST): iq = max(0, iq-25)
return max(0, min(100, iq))

```
