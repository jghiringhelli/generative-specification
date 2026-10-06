# Cinderfall (game rules engine)

A two-player card duel. I want only the rules engine as a library, no screen: the same engine will later sit behind a website and a bot.

**Stack.** Node 24, no runtime packages. Only runtime dependencies are fixed: development tools (test runners, linters, git hooks) are unrestricted.

**Rules.**

1. Each player starts with 20 life and draws 5 cards from their own deck. Decks are lists of cards; a card has a name, a cost in ember, a kind (`creature` or `spell`), and power.
2. A turn has four phases in order: draw, play, clash, decay. The player whose turn it is acts; the other waits.
3. Draw: take one card (nothing happens if the deck is empty, but the player loses 1 life instead).
4. Ember: at the start of your turn gain 2 ember, to a maximum of 6. Playing a card costs its ember.
5. Play: put any number of affordable cards from hand into play. A creature stays on the board with toughness equal to its power. A spell resolves at once: it deals its power as damage to a chosen target, creature or player.
6. Clash: your creatures attack in the order they were played. Each attacks the opposing creature that was played earliest; if there is none, it hits the opposing player. Damage to a creature reduces its toughness; at zero it leaves the board. Damage to a creature does not carry over to the player.
7. Decay: each creature of yours that attacked loses 1 toughness. Unspent ember above 3 burns down to 3.
8. A player at 0 or less life loses. If both fall in the same clash, the player whose turn it was loses.
9. The engine exposes: start a game from a seed and two decks, list the legal actions, apply one action and get the new state or a reason for refusal. The same seed and the same actions always give the same game.

**First slice.** Setup and draw; playing cards with ember; the clash.

**My quality bar.** Every rule above should have a test, and adding a card kind later must not mean rewriting the engine.
