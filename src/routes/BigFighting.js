import React from 'react';
import {connect} from 'dva';
import styles from './IndexPage.less';
import classNames from 'classnames';
import is from 'is_js';

class BigFighting extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: 'qbhy', // 独有
            status: 'running',  // 正在运行游戏: running, 等待游戏开始: waiting
            x: 30,
            y: 30,
            speed: 1000,
            snake: [
                {
                    status: 'watching', // 观战: watching, 等待开始游戏: waiting, 游戏中: playing
                    name: '谢坚来',
                    speed: 1,
                    direction: {
                        prev: 'right',
                        next: 'right',
                    },
                    body: []
                }
            ],
            rule: {
                top: -30,
                right: 1,
                bottom: 30,
                left: -1,
            },
            food: [],
            maps: [],
            logs: [],
        };
    }

    componentWillMount() {
        this.ws = new WebSocket("ws://localhost:8080/ws");

        setInterval(() => {
            this.ws.send(JSON.stringify({
                action: '函数名',
                args: "参数"
            }));
        }, 3000);

        this.initGame();
    }

    // 初始化游戏，计算各种初始值
    initGame() {
        const {x, y} = this.state,
            count = x * y,
            snake = {
                body: [5, 4, 3, 2, 1, 0],
                direction: {
                    prev: 'right',
                    next: 'right',
                }, //top,right,bottom,left
            },
            food = this.randomFood(snake, count),
            maps = this.renderMaps(count, snake, food);

        this.setState({maps, snake, food});
    }

    componentDidMount() {
        this.startGame();
    }

    // 渲染表格
    renderMaps = (count, snake, food) => {
        const maps = [];
        for (let i = 0; i < count; i++) {
            maps.push({
                type: is.inArray(i, snake.body) ?
                    (
                        i === snake.body[0] ? styles.head : styles.snake
                    ) :
                    i === food ? styles.food : styles.null, //food
            });
        }
        return maps;
    };

    /**
     * 开始游戏需要做的工作
     */
    startGame() {
        const {snake, speed} = this.state;
        /**
         * 方向变换
         */
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
        this.next(); //开启游戏
    }

    // 每一帧游戏
    next() {
        const {x, y, snake, rule, speed, logs} = this.state,
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
        this.timer = setTimeout(() => this.next(), (speed.base - snake.body.length * 2) / speed.super); // 指定速度执行下一步。
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

    render() {
        const {maps, logs} = this.state;
        return (
            <div className={styles.container}>
                <div className={styles.snakeBox}>
                    {maps.map((map, index) => {
                        return (
                            <div key={index} className={classNames(styles.map, map.type)}></div>
                        )
                    })}
                </div>
                <div className={styles.gameInfo}>
                    {logs.map((log, index) => {
                        return <p key={index}>{log}</p>
                    })}
                    <p>变换方向请按 WDSA, 加速请按空格</p>
                    <button onClick={() => {
                        clearInterval(this.timer);
                        this.initGame();
                        setTimeout(() => {
                            this.next();
                        }, 300);
                    }}>重新开始游戏
                    </button>
                </div>
            </div>
        );
    }
}


export default connect()(BigFighting);
