# ncore-makeup

Userscript az ncore felületének átalakításához.  
Egy kis púder és szájfény.

## Najó, de mit csinál

Jelenleg:  
- IMDB id-k alapján csoportosítja a torrent listában a találatokat és egy borítóval ellátott blokkba szervezi őket. (Csak azt tudja átcsoportosítani ami a listában van)
- Egy kattintással a listából le lehet kérdezni az adott filmhez az összes verziót. (a sorrendezés nem fog megegyezni az eredeti listával, és nem lesznek jelző ikonok, viszont ugyanúgy le lehet kérni a részletes adatokat a névre kattintva és könyvjelzőzni is lehet)
- A lista rendezési elve (ha csak nincs külön a rendezés az oldalon módosítva): az egyes csoportban lévő legrégebbi elem dátuma szerint rendez csökkenőben, így hiába jön egy újabb release egy filmhez, az nem fog a lista elejére ugrani. Az oka, hogy könnyeb legyen kiszúrni az újonnan érkezett filmeket.

Eredeti:  
![Eredeti](/images/Original.png)

Csoportosított:  
![Makeup](/images/Grouped.png)

## Akarom, hogyan?

Kell valamilyen userscript támogatás, pl [Tampermonkey](https://www.tampermonkey.net/) ami mindenféle böngészőhöz elérhető. (fejlesztve/tesztelve jelenleg Chrome alatt van) 
Ha megvan, akkor klikk erre a linkre:  
https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js

## Kipróbáltam, szétesik az oldal

Az alap témával és brutecore-al van leginkább fejlesztve/tesztelve/használva, ezért simán előfordulhatnak hibák főleg más témáknál.  
Lehet jelezni itt az issueknál vagy méginkább egy jó pull-request-el ;)

## Tampermonkey - "This script was not executed yet"

Úgy tűnik, hogy az 5.0.0 frissítés után csak akkor tudja futtatni a scriptet a tampermonkey ha a developer mód be van kapcsolva az extensionoknál.
chrome://extensions oldalon jobb felül "Developer mode".
Nem teljesen tudom, hogy ez milyen kockázatokat rejt, mindenki saját felelősséggel használja.
Több infó: https://www.tampermonkey.net/faq.php?locale=en#Q209
