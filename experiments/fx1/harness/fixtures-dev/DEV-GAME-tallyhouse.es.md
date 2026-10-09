# Tallyhouse (biblioteca de lógica de juego, Python 3.11)

Estamos haciendo un juego de cartas de bazas para cuatro jugadores llamado Tallyhouse y necesito el motor de reglas como una biblioteca de Python (sin pantallas ni red), probada con pytest. Stack: Python 3.11, solo biblioteca estándar en ejecución.

El mazo tiene 32 cartas: los cuatro palos (tréboles, diamantes, corazones, picas), con los valores 7, 8, 9, 10, J, Q, K, A. A cada jugador se le reparten 8 cartas. Antes de una ronda cada jugador apuesta cuántas bazas espera ganar, de 0 a 8. Quien apuesta 0 está en "nil".

El jugador a la izquierda del repartidor sale en la primera baza. Hay que seguir el palo con que se salió si se puede; si no se puede, se puede jugar cualquier carta. La carta más alta del palo de salida gana la baza, y quien la gana sale en la siguiente. No hay palo de triunfo.

Puntuación de una ronda: un jugador que gana exactamente las bazas que apostó obtiene 10 puntos más 2 por cada baza apostada. Quien gana más de lo apostado obtiene solo 1 punto por baza ganada. Quien gana menos de lo apostado pierde 5 puntos por cada baza que le falta. Un nil cumplido (cero bazas) vale 25; un nil que gana alguna baza pierde 25 y nada más. El primer jugador en llegar a 100 puntos termina el juego al cierre de esa ronda, y gana quien tenga más puntos; si dos empatan arriba, juegan otra ronda. Los puntajes pueden quedar bajo cero.

Quiero que la biblioteca pueda: decir qué cartas puede jugar legalmente un jugador, decidir quién gana una baza, puntuar una ronda, y decirme cuándo termina el juego y quién ganó. La primera porción es: jugadas legales, ganador de la baza, puntuación de la ronda.
