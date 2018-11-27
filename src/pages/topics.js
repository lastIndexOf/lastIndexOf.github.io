import React, {Component} from 'react';
import {Route, Link} from 'react-router-dom';

const Topic = ({match}) => <h3>Requested Param: {match.params.id}</h3>;
const Topics = ({match}) => (
    <div>
        <h2>Topics</h2>

        <ul>
            <li>
                <Link to={`${match.url}/components`}>Components</Link>
            </li>
            <li>
                <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
            </li>
        </ul>

        <Route path={`${match.path}/:id`} component={Topic} />
        <Route
            exact
            path={match.path}
            render={() => <h3>Please select a topic.</h3>}
        />
    </div>
);

export default Topics;
