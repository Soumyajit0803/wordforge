Challenge status:
1. Guest to guest challenges working
    - Need to have a way to view guest match results since they are anyways getting stored in database.
2. Account to Account challenges working
3. Account to guest challenge working
    - Made a middleware that will check for guest profile and if not existing, creates one.
4. Guest to account: working

Future important works:
1. `Current streak` not working as usual.
2. `status` variable needs to be scrapped from database, or its implementation needs a major fix

Future casual works:
1. Do better on the play/[id]/page.tsx file to have a link to go to the current challenges. User must not have to interact with the URL.

Questions:
1. If atleast one player is guest, should we update the user_stats at all? That would actually open a loophole to achieve good results when registered user manipulates the guest/acts as the guest opponent. ANSWER: NO

