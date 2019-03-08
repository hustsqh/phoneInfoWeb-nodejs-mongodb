#!/bin/bash

ps -elf |grep node|awk '{print $4}'|xargs kill -9
echo "kill node appjs over"

