#!/usr/bin/python3.8
from enum import Enum, auto
from fnmatch import fnmatch
from glob import glob
import shutil
import argparse
from subprocess import run
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
    shutil.rmtree('dist')
    run(['npx', 'tsc', '-b'])
    copyDir('dist', 'deploy')
    copyFiles(['package.json', 'package-lock.json'], 'deploy')


def deploy():
    run(['scp', '-r', *glob('deploy/*', recursive=True),
        'root@172.104.236.178:/root/news-scraper'])
    run(['ssh', 'root@172.104.236.178', 'cd',
        '/root/news-scraper', ';', 'npm', 'ci'])


def fetch():
    run(['scp', 'root@172.104.236.178:/root/news-scraper/db.db', 'remoteDB.db'])


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
