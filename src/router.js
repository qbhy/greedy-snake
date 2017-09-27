import React from 'react';
import {Router, Route, Switch} from 'dva/router';
import IndexPage from './routes/IndexPage';
import BigFighting from './routes/BigFighting';

function RouterConfig({history}) {
    return (
        <Router history={history}>
            <Switch>
                <Route path="/big-fighting" exact component={BigFighting}/>
                <Route path="*" exact component={IndexPage}/>
            </Switch>
        </Router>
    );
}

export default RouterConfig;
