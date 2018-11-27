import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import { HashRouter as Router, Route } from 'react-router-dom';
import Home from './pages/home';
import About from './pages/about';
import Topics from './pages/topics';
import Header from './components/header';
import './app.less';

const App = () => (
    <Router>
        <div>
            <Header />
            <Route exact path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/topics" component={Topics} />
        </div>
    </Router>
);

export default hot(module)(App);
