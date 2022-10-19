# news-scraper

This repository contains multiple smaller components.

## Scraper

This is the main component. It is a simple script that runs one time (or more via cronjob).
It creates a sqlite DB which contains recently published articles and their talkbacks.
It gets the articles via rss and their talkbacks via various APIs provided by each article corresponding site.

## Server

In here all calculations related to topics are made.
The server is capable of sifting through the DB in order to find talkbacks related to each other and return to the client in millisecond.

## News Game

[Live site here](https://news.shavzak.com)

This is the client side of the project. This site was designed with a mobile first layout in mind. It contains a simple game based on the scraper DB.
The game goes as follows; it shows the player a random article from the scraper DB and 4 random talkbacks as well.
One of the talkbacks was posted on the actual article and the players job is to guess which one.

![screen recording of the news game](https://user-images.githubusercontent.com/47389924/193537756-59c47619-1072-49fe-b8ff-92457761392a.gif)

### notes

This whole project is built with typescript, express, and react. The DB as stated above is a sqlite DB hosted on premise.
The project is hosted on [Linode](https://www.linode.com/) and served using nginx.
It is managed via ssh and a custom python script that helps with the upload process.
