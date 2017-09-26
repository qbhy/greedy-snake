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
            speed: 1000,
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

    renderMaps = (count, snake, food) => {
        const maps = [];
        for (let i = 0; i < count; i++) {
            maps.push({
                type: is.inArray(i, snake.body) ? styles.snake : i === food ? styles.food : styles.null, //food
            });
        }
        return maps;
    };

    startGame() {
        const {speed, snake} = this.state;
        console.log(snake);
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
        this.next();
    }

    next() {
        const {x, y, snake, rule, speed} = this.state,
            count = x * y;
        let food = this.state.food;
        if (snake.body.length >= count) {
            return alert("恭喜你，爆机啦~");
        }
        const next = snake.body[0] + rule[snake.direction.next];
        // 判断有没有撞墙
        if (is.inArray(next, snake.body)) {
            return this.gameOver("你撞到自己的身体啦！");
        }
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
        snake.body.unshift(next);
        if (next !== food) {
            snake.body.pop();
        } else {
            food = this.randomFood(snake, count, food);
        }
        snake.direction.prev = snake.direction.next;
        this.setState({
            snake,
            maps: this.renderMaps(count, snake, food),
            food
        });
        setTimeout(() => this.next(), speed - snake.body.length * 2);
    }

    randomFood = (snake, count, food = null) => {
        let newFood = Math.floor(Math.random() * count);
        while (is.inArray(newFood, snake.body) || food === newFood) {
            newFood = Math.floor(Math.random() * count);
        }
        return newFood;
    };

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
