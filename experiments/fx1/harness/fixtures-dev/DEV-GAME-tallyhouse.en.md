# Tallyhouse (game logic library, Python 3.11)

We are making a four-player trick-taking card game called Tallyhouse and I need the rules engine as a Python library (no screens, no networking), tested with pytest. Stack: Python 3.11, standard library only at runtime.

The deck has 32 cards: the four suits (clubs, diamonds, hearts, spades), ranks 7, 8, 9, 10, J, Q, K, A. Each player is dealt 8 cards. Before a round every player bids how many tricks they expect to win, from 0 to 8. A player who bids 0 is "nil".

The player to the left of the dealer leads the first trick. You must follow the suit that was led if you can; if you cannot you may play anything. The highest card of the led suit wins the trick, and the winner leads the next one. There is no trump suit.

Scoring a round: a player who wins exactly as many tricks as bid scores 10 points plus 2 for every trick they bid. A player who wins more than they bid scores only 1 point per trick won. A player who wins fewer than they bid loses 5 points for each trick they are short. A nil bid that is kept (zero tricks) scores 25; a nil that takes any trick loses 25 and nothing else. The first player to reach 100 points ends the game after that round, and the player with the most points wins; if two are tied at the top, they play another round. Scores can go below zero.

I want the library to be able to: say which cards a player may legally play, decide who wins a trick, score a round, and tell me when the game is over and who won. The first slice is: legal plays, trick winner, round scoring.
