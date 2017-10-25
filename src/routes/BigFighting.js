import React from 'react';
import {connect} from 'dva';
import styles from './BigFighting.less';
import classNames from 'classnames';
import is from 'is_js';
import {delay} from '../utils';
import {
    message
} from 'antd';

class BigFighting extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null, // 独有
            status: 'waiting',  // 正在运行游戏: running, 等待游戏开始: waiting
            x: 30,
            y: 30,
            speed: 1000,
            snakes: [
                {
                    status: 'watching', // 观战: watching, 等待开始游戏: waiting, 游戏中: playing
                    name: '谢坚来',
                    speed: 1,
                    color: "red",
                    prevDirection: 'right',
                    nextDirection: 'right',
                    body: [],
                }
            ],
            rule: {
                top: -30,
                right: 1,
                bottom: 30,
                left: -1,
            },
            spectators: [],
            food: [],
            logs: [],
            maps: [], // 前端渲染，无需后端返回
        };
    }

    componentWillMount() {
        this.ws = new WebSocket("ws://localhost:8080/ws");

        this.ws.onopen = () => {
            // this.exec('init');
        };

        this.ws.onclose = () => {
            message.warning("链接已断开,请检查你的网络！");
        };

        this.ws.onmessage = ({data}) => {
            this.handleResponse(JSON.parse(data));
        };
    }

    handleResponse(data) {
        if (is.function(this[data.action])) {
            this[data.action](data.data);
        } else {
            message.error(data.action + "方法找不到");
            console.log(data.action + "方法找不到", data);
        }
    }

    HandleError = msg => message.error(msg);

    ShowMessage = msg => message.info(msg);

    SetInitState(state) {
        this.setState({...state}, () => {
            this.InitGame();
        });
    }

    exec(action, args = null) {
        this.ws.send(JSON.stringify({action, args}));
    }

    // 渲染表格
    renderMaps(state = null) {
        state = state || this.state;
        const maps = [],
            {x, y, snakes, foods} = state,
            count = x * y;
        let snake;
        for (let i = 0; i < count; i++) {
            let map = {
                type: styles.null,
                color: undefined,
            };
            for (let user in snakes) {
                snake = snakes[user];

                if (is.inArray(i, snake.body)) {
                    map = {
                        type: i === snake.body[0] ? styles.head : styles.snake,
                        color: snake.color,
                    };
                } else if (is.inArray(i, foods)) {
                    map.type = styles.food;
                }
            }
            maps.push(map);

        }
        return maps;
    };

    // 开始游戏需要做的工作
    StartGame() {
        const {snake, speed} = this.state;
        //  方向变换
        key('w', () => {
            if (snake.direction.prev !== 'bottom') {
                snake.direction.next = 'top';
                this.setState({snake});
            }
        });
        key('d', () => {
            if (snake.direction.prev !== 'left') {
                snake.direction.next = 'right';
                this.setState({snake});
            }
        });
        key('s', () => {
            if (snake.direction.prev !== 'top') {
                snake.direction.next = 'bottom';
                this.setState({snake});
            }
        });
        key('a', () => {
            if (snake.direction.prev !== 'right') {
                snake.direction.next = 'left';
                this.setState({snake});
            }
        });
        // 空格开启倍速
        key('space', () => {
            speed.super++;
            if (speed.super > 5) {
                speed.super = 1;
            }
            this.state.logs.push("已加速，现在的速度是" + speed.super);
            this.setState({speed});
        });
    }

    // 每一帧游戏
    next() {
        const {x, y, snakes, rule, speed, logs} = this.state,
            count = x * y;
        let food = this.state.food;
        if (snake.body.length >= count) {
            return alert("恭喜你，爆机啦~");
        }
        const next = snake.body[0] + rule[snake.direction.next];
        // 判断有没有撞到自己
        if (is.inArray(next, snake.body)) {
            return this.gameOver("你撞到自己的身体啦！");
        }
        // 判断是否有撞到墙
        switch (snake.direction.next) {
            case 'top':
                if (next / x < 0) {
                    return this.gameOver("你撞到墙啦！");
                }
                break;
            case 'right':
                if (next % x === 0) {
                    return this.gameOver("你撞到墙啦！");
                }
                break;
            case 'bottom':
                if (next / x > x) {
                    return this.gameOver("你撞到墙啦！");
                }
                break;
            case 'left':
                if (next % x === x - 1) {
                    return this.gameOver("你撞到墙啦！");
                }
                break;
        }
        // 前进一步
        snake.body.unshift(next);
        if (next === food) {    // 判断是否吃到食物
            food = this.randomFood(snake, count, food); // 食物被吃掉了，重新生成食物
            logs.push("吃到食物,体长 + 1, 现在的长度是" + snake.body.length);
        } else {
            snake.body.pop(); // 没迟到食物，收尾
        }
        snake.direction.prev = snake.direction.next; // 处理方向
        this.setState({
            snake,
            maps: this.renderMaps(count, snake, food),
            food,
            logs
        });
        this.timer = setTimeout(() => this.next(), (speed - snake.body.length * 2) / speed.super); // 指定速度执行下一步。
    }

    // 随机生成食物
    randomFood = (snake, count, food = null) => {
        let newFood = Math.floor(Math.random() * count);
        while (is.inArray(newFood, snake.body) || food === newFood) {
            newFood = Math.floor(Math.random() * count);
        }
        return newFood;
    };

    // 结束游戏
    gameOver(message) {
        this.state.logs.push(message + "游戏结束!你的体长是: " + this.state.snake.body.length);
        this.setState({});
    }

    initName() {
        this.exec('InitGame', this.userInput.value);
    }

    InitName(name) {
        this.setState({user: name});
    }

    SetRoomInfo(state) {
        this.setState({
            ...state,
            maps: this.renderMaps(state)
        });
    }

    AddLog(log) {
        this.state.logs.push(log);
        this.setState({}, () => {
            this.contentInput.focus();
        });
    }

    sendLog() {
        if (this.contentInput.value.length > 0) {
            this.exec('AddLog', this.contentInput.value);
            return this.contentInput.value = '';
        }
        message.warning('请输入内容在发送');
        this.contentInput.focus();
    }

    render() {
        const {maps, logs, status, user, x, y, snakes} = this.state,
            snake = snakes[user];
        if (is.null(user)) {
            return (
                <div>
                    请输入您的昵称
                    <input type="text" ref={ref => this.userInput = ref}/>
                    <button onClick={() => this.initName()}>确定</button>
                </div>
            );
        }
        return (
            <div className={styles.container}>

                <div style={{
                    width: 16 * x,
                    height: 16 * y,
                }} className={styles.snakeBox}>
                    {maps.map((map, index) => (
                        <div key={index} style={{background: map.color}} className={classNames(styles.map, map.type)}>
                        </div>
                    ))}
                </div>

                <div style={{
                    height: 16 * y,
                }} className={styles.gameInfo}>
                    <header  style={{color: snake ? snake.color : '#333'}}>
                        贪吃蛇大作战 - {user} - {status === 'waiting' ?
                        (
                            (
                                snakes[user] ? '已准备' : <button onClick={() => this.exec('Ready')}>开始游戏</button>
                            )
                        ) : '游戏进行中'}
                    </header>
                    <section>
                        <div className={styles.logs}>
                            {logs.map((log, index) => {
                                return <p key={index}>{log}</p>
                            })}
                        </div>
                        <div className={styles.actions}>
                            <textarea ref={ref => this.contentInput = ref}>{null}</textarea>
                            <button onClick={() => this.sendLog()}>发送消息</button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
}


export default connect()(BigFighting);
