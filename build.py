#!/usr/bin/python3.8
from enum import Enum, auto
from fnmatch import fnmatch
from glob import glob
import os
import shutil
import argparse
from subprocess import Popen, run, DEVNULL
from typing import List
import signal


class Actions(Enum):
    build = auto()
    deploy = auto()
    bDeploy = auto()
    fetch = auto()
    dev = auto()


parser = argparse.ArgumentParser(description='Build project')
parser.add_argument('action',
                    nargs='?',
                    choices=Actions._member_names_,
                    default='build',
                    help='action to preform (default: build)')
parser.add_argument('-n', action='store_true', help='start NEMO in dev mode')

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


def dev():
    processes: List[Popen] = []

    def hanlde_sigint(sig, frame):
        for process in processes:
            process.terminate()

    signal.signal(signal.SIGINT, hanlde_sigint)
    # server
    processes.append(Popen(['npx', 'tsc'], cwd='server'))
    processes.append(Popen(['npx', 'nodemon', 'dist/server.js'], cwd='server'))

    # scraper
    processes.append(Popen(['npx', 'tsc'], cwd='scraper'))

    # NEMO
    if args.n:
        processes.append(
            Popen(['docker', 'compose', 'up', '--remove-orphans', '-d'], cwd='NEMO'))

    # news-game
    processes.append(Popen(['npm', 'start'], cwd='news-game'))

    signal.pause()


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
elif args.action == Actions.dev.name:
    if os.geteuid() != 0 and args.n:
        exit("You need to have root privileges to run this script.\nPlease try again, this time using 'sudo'. Exiting.")

    print("start dev_env\nhit ctrl + c to stop")
    dev()
