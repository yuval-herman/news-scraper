#!/usr/bin/python3.8
from enum import Enum, auto
from fnmatch import fnmatch
from glob import glob
import shutil
import argparse
from subprocess import Popen, run, DEVNULL
from typing import List


class Actions(Enum):
    build = auto()
    deploy = auto()
    bDeploy = auto()
    fetch = auto()


parser = argparse.ArgumentParser(description='Build project')
parser.add_argument('action',
                    nargs='?',
                    choices=Actions._member_names_,
                    default='build',
                    help='action to preform (default: build)')

args = parser.parse_args()


def copyDir(src: str, dst: str):
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst)


def copyFiles(src: List[str], dst: str):
    for file in src:
        shutil.copy(file, dst)


def build():
    # scraper
    shutil.rmtree('scraper/dist', ignore_errors=True)
    run(['npx', 'tsc', '-b'], cwd='scraper')

    # server
    shutil.rmtree('server/dist', ignore_errors=True)
    run(['npx', 'tsc', '-b'], cwd='server')

    # news-game
    run(['npm', 'run', 'build'], cwd='news-game')


def deploy():
    # scraper
    copyDir('scraper/dist', 'deploy/scraper')
    copyFiles(['scraper/package.json', 'scraper/package-lock.json', 'scraper/ignorewords.txt'],
              'deploy/scraper')

    # server
    copyDir('server/dist', 'deploy/server')
    copyFiles(['server/package.json', 'server/package-lock.json'],
              'deploy/server')

    # news-game
    copyDir('news-game/build', 'deploy/news-game')

    # copy all files
    run(['scp', '-r', *glob('deploy/*'),
        'root@172.104.236.178:/root/news-scraper/'])

    # install scraper
    run(['ssh', 'root@172.104.236.178', 'cd',
        '/root/news-scraper/scraper', ';', 'npm', 'ci'])
    Popen(['ssh', 'root@172.104.236.178', 'cd',
           '/root/news-scraper/scraper', ';', 'node', 'scraper.js'], stdout=DEVNULL)

    # install server
    run(['ssh', 'root@172.104.236.178', 'cd',
        '/root/news-scraper/server', ';', 'npm', 'ci'])
    run(['ssh', 'root@172.104.236.178', 'systemctl',
        'restart', 'news-game-server.service'])


def fetch():
    run(['scp', 'root@172.104.236.178:/root/news-scraper/scraper/db.db', 'remoteDB.db'])


if args.action == Actions.build.name:
    print('building')
    build()
    print('run again with the deploy option in order to send the changes to the server')
elif args.action == Actions.deploy.name:
    print("deploying")
    deploy()
elif args.action == Actions.bDeploy.name:
    print("building then deploying")
    build()
    deploy()
elif args.action == Actions.fetch.name:
    print("fetching db")
    fetch()
