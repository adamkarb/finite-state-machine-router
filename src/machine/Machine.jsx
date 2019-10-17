import React, { useEffect, useMemo, useState } from 'react';
import { createBrowserHistory } from 'history';
import { log } from './util';

export const MachineContext = React.createContext();
MachineContext.displayName = 'Machine';

export function Machine ({ children, history, id, url }) {
    const [ state, setState ] = useState({ current: `#${id}` });

    // Default history
    // useMemo(() => {
        if (!history) {
            // console.log('history');
            history = createBrowserHistory({ basename: url });
        }
    // }, []);
    
    // const isExact = (stateId) => state.current === stateId;
    const matches = (stateId) => {
        // console.log('matches', stateId, state.current);
        return state.current.split('.').includes(stateId);
    }
    const resolveStack = (stack) => {
        console.log('resolveStack', stack);
        setState({ ...state, current: stack });
    }
    const resolveUrl = (url) => {
        console.log('resolveUrl', url);
        history.push(url, { stack: state.current });
    }
    const transition = (event, target) => {
        console.log('transition', event, target);
        // log(state, event, target);
        setState({ ...state, current: target })
    }

    useEffect(() => history.listen((location, action) => {
        console.log('history listen', location, action);
        resolveStack(`#${id}${_routeMap[location.pathname]}`);
    }));

    const routeMap = (childStates, parentUrl, parentStack) => {
        return childStates.reduce((acc, { props }, i) => {
            const { children, id, url } = props;
            const _childStates = React.Children.toArray(children).filter(c => c.type.name === 'State');
            const _fullUrl = parentUrl ? parentUrl + url : url;
            const _parentStack = parentStack ? `${parentStack}.${id}` : `.${id}`;
    
            if (url) {
                acc[_fullUrl] = _parentStack;
            }
            if (_childStates.length) {
                acc = { ...acc, ...routeMap(_childStates, _fullUrl, _parentStack) }
            }
    
            return acc;
        }, {});
    }

    // Determine initial child StateNode (if undefined, which is likely)
    const { _children, _routeMap } = useMemo(() => {
        let _childStates = React.Children.toArray(children).filter(c => c.type.name === 'State');
        const _hasInitialChild = _childStates.filter(c => c.props.initial).length > 0;
        const _pathname = history.location.pathname;
        const _routeMap = routeMap(_childStates);

        // 1. Derive state from URL
        if (_pathname.slice(1)) {
            if (_routeMap.hasOwnProperty(_pathname)) {
                // console.log('resolve stack from URL');
                resolveStack(`#${id}${_routeMap[_pathname]}`);
            } else {
                // TODO:
                // Resolve to 404
                console.error(`Route ${_pathname} was not found!`);
            }
        }
        // 2. Resolve initial children
        else {
            if (!_hasInitialChild) {
                _childStates[0] = React.cloneElement(_childStates[0], {
                    ..._childStates[0].props,
                    initial: true
                });
            }
        }

        return {
            _children: _childStates,
            _routeMap
        };
    }, [ children ]);

    // console.log(_routeMap);

    const providerValue = {
        ...state,
        history,
        id,
        matches,
        resolveStack,
        resolveUrl,
        transition
    }
    
    return <MachineContext.Provider value={providerValue}>
        {_children}
    </MachineContext.Provider>;
}

