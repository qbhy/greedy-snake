import React from 'react';
import {connect} from 'dva';
import styles from './IndexPage.less';
import classNames from 'classnames';
import is from 'is_js';

class IndexPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            x: 30,
            y: 30,
            speed: {
                base: 1000,
                super: 1,
            },
            maps: [],
            snake: {
                direction: {
                    prev: 'right',
                    next: 'right',
                },
                body: []
            },
            rule: {
                top: -30,
                right: 1,
                bottom: 30,
                left: -1
            },
            food: 50
        };
    }

    componentWillMount() {
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
            if (speed.super > 3) {
                speed.super = 1;
            }
            this.setState({speed});
        });
        this.next(); //开启游戏
    }

    // 每一帧游戏
    next() {
        const {x, y, snake, rule, speed} = this.state,
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
                if (next % x === 29) {
                    return this.gameOver("你撞到墙啦！");
                }
                break;
        }
        // 前进一步
        snake.body.unshift(next);
        if (next === food) {    // 判断是否吃到食物
            food = this.randomFood(snake, count, food); // 食物被吃掉了，重新生成食物
        } else {
            snake.body.pop(); // 没迟到食物，收尾
        }
        snake.direction.prev = snake.direction.next; // 处理方向
        this.setState({
            snake,
            maps: this.renderMaps(count, snake, food),
            food
        });
        setTimeout(() => this.next(), (speed.base - snake.body.length * 2) / speed.super); // 指定速度执行下一步。
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
        alert(message + "游戏结束!");
    }

    render() {
        const {maps} = this.state;
        return (
            <div className={styles.container}>
                {maps.map((map, index) => {
                    return (
                        <div key={index} className={classNames(styles.map, map.type)}></div>
                    )
                })}
            </div>
        );
    }
}

IndexPage.propTypes = {};

export default connect()(IndexPage);
