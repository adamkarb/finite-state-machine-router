import React, { useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserHistory } from 'history';
import {
    getChildStateNodes,
    getInitialChildStateNode,
    injectUrlParams,
    normalizeChildStateProps,
    resolveInitial,
    resolveToAtomic,
    selectTransition
} from './util';

export const MachineContext = React.createContext({});
MachineContext.displayName = 'Machine';

// export const createMachine = (id, path) => (props) => Machine({ ...props, id, path });

export const useMachine = () => {
    const { current, history, id, params, send } = useContext(MachineContext);
    return [{ current, history, id, params }, send ];
}

function Machine ({ children: machineChildren, history: machineHistory, id: machineId, path: machinePath }) {
    let history = machineHistory || createBrowserHistory({ basename: machinePath });

    const [ childStates, normalized ] = useMemo(() => {
        const _childStates = getChildStateNodes(React.Children.toArray(machineChildren));

        if (_childStates.length === 0) {
            throw new Error('<Machine/> has no children <State/> nodes! At least one is required to be considered a valid state machine.');
        }

        const _normalized = normalizeChildStateProps(_childStates, machineId);

        // Check for a wildcard state
        // if (!_normalized.find(({ id }) => id === '*')) {
        //     _childStates.push(<State id='*' component={props => <div>Not found</div>}/>)
        // }

        return [ _childStates, _normalized ];
    }, [ machineChildren ]);

    const [ initialStack, params ] = useMemo(() => {
        let initialStack = '#' + machineId + '.' + getInitialChildStateNode(childStates).props.id;
        const { params, path, stack, url } = resolveInitial(history.location.pathname, normalized, machineId);

        if (history.location.pathname !== url) {
            history.push(url);
        }

        return [ stack || initialStack, params ];
    }, []);

    const [ state, setState ] = useState({
        current: initialStack,
        event: null,
        params
    });

    function resolvePath(path) {
        const url = injectUrlParams(path, state.params);

        if (url !== history.location.pathname) {
            history.push(url, { stack: state.current });
        }
    }

    /*
        Todo:
        populate event queue and execute after render with useEffect, instead of immediately
    */
    function send(event, data = null) {
        const targetState = selectTransition(event, state.current, normalized);

        if (targetState) {
            const params = data && data.params || state.params;
            const { cond, event: transitionEvent, target: targetId } = targetState;
            const targetNode = normalized.find(norm => norm.id === targetId);

            if (targetNode) {
                const { path, stack } = resolveToAtomic(
                    targetNode.stack,
                    normalized
                );

                // unable to redirect to yourself / loader doesn't dissapear
                //if (stack === state.current) {
                //    return;
                //}

                // if (process.env.NODE_ENV === 'development') {
                    console.log('Machine Event Sent:', {
                        event: event,
                        data,
                        targetId,
                        path
                    });
                // }

                // console.log('machine setState', 1, state.current, stack);
                setState({ current: stack, event: event, params });
                // console.log('machine setState', 2, state, stack);
            } else {
                console.error(`Invalid transition target: No target State Node of id "${targetId}" exists. event ${event} will be discarded.`);
            }
        }
    }

    // useEffect(() => console.log('machine current', state, history.location.pathname));

    useEffect(() => {
        const { current, event } = state;

        return history.listen(({ action, location }) => {
            const { params, path, stack, url } = resolveInitial(location.pathname, normalized, machineId);

            if (stack !== current) {
                setState({ current: stack, params });
            }
        });
    }, [ state.current ]);

    const providerValue = {
        ...state,
        history,
        id: machineId,
        resolvePath,
        send
    };

    return <MachineContext.Provider value={providerValue}>
        {childStates}
    </MachineContext.Provider>;
}

Machine.displayName = 'Machine';

export const createMachine = (props) => Machine(props);
export default Machine;
