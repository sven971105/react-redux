/* eslint-disable @typescript-eslint/no-unused-vars, no-inner-declarations */

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  Store,
  Dispatch,
  AnyAction,
  ActionCreator,
  createStore,
  bindActionCreators,
  ActionCreatorsMapObject,
  Reducer,
} from 'redux'
import {
  connect,
  ConnectedProps,
  Provider,
  DispatchProp,
  MapStateToProps,
  ReactReduxContext,
  ReactReduxContextValue,
  Selector,
  shallowEqual,
  MapDispatchToProps,
  useDispatch,
  useSelector,
  useStore,
  createDispatchHook,
  createSelectorHook,
  createStoreHook,
  TypedUseSelectorHook,
} from '../../src/index'

import {
  CounterState,
  counterSlice,
  increment,
  incrementAsync,
  AppDispatch,
  AppThunk,
  RootState,
  fetchCount,
} from './counterApp'

function preTypedHooksSetup() {
  // Standard hooks setup
  const useAppDispatch = () => useDispatch<AppDispatch>()
  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

  function CounterComponent() {
    const dispatch = useAppDispatch()

    return (
      <button
        onClick={() => {
          dispatch(incrementAsync(1))
        }}
      />
    )
  }
}

function TestSelector() {
  interface OwnProps {
    key?: string | undefined
  }
  interface State {
    key: string
  }

  const simpleSelect: Selector<State, string> = (state: State) => state.key
  const notSimpleSelect: Selector<State, string, OwnProps> = (
    state: State,
    ownProps: OwnProps
  ) => ownProps.key || state.key

  const ownProps = {}
  const state = { key: 'value' }
  simpleSelect(state)
  notSimpleSelect(state, ownProps)
  // @ts-expect-error
  simpleSelect(state, ownProps)
  // @ts-expect-error
  notSimpleSelect(state)
}

function testShallowEqual() {
  // @ts-expect-error
  shallowEqual()
  // @ts-expect-error
  shallowEqual('a')
  shallowEqual('a', 'a')
  shallowEqual({ test: 'test' }, { test: 'test' })
  shallowEqual({ test: 'test' }, 'a')
  const x: boolean = shallowEqual('a', 'a')
}

function testUseDispatch() {
  const actionCreator = (selected: boolean) => ({
    type: 'ACTION_CREATOR',
    payload: selected,
  })
  const thunkActionCreator = (selected: boolean) => {
    return (dispatch: Dispatch) => {
      return dispatch(actionCreator(selected))
    }
  }

  const dispatch = useDispatch()
  dispatch(actionCreator(true))
  dispatch(thunkActionCreator(true))
  dispatch(true)

  type ThunkAction<TReturnType> = (dispatch: Dispatch) => TReturnType
  type ThunkDispatch = <TReturnType>(
    action: ThunkAction<TReturnType>
  ) => TReturnType
  // tslint:disable-next-line:no-unnecessary-callback-wrapper (required for the generic parameter)
  const useThunkDispatch = () => useDispatch<ThunkDispatch>()
  const thunkDispatch = useThunkDispatch()
  const result: ReturnType<typeof actionCreator> = thunkDispatch(
    thunkActionCreator(true)
  )
}

function testUseSelector() {
  interface State {
    counter: number
    active: string
  }

  const selector = (state: State) => {
    return {
      counter: state.counter,
      active: state.active,
    }
  }
  const { counter, active } = useSelector(selector)
  counter === 1
  // @ts-expect-error
  counter === '321'
  active === 'hi'
  // @ts-expect-error
  active === {}

  // @ts-expect-error
  const { extraneous } = useSelector(selector)
  useSelector(selector)

  // @ts-expect-error
  useSelector(selector, 'a')
  useSelector(selector, (l, r) => l === r)
  useSelector(selector, (l, r) => {
    // $ExpectType { counter: number; active: string; }
    l
    return l === r
  })

  const correctlyInferred: State = useSelector(selector, shallowEqual)
  // @ts-expect-error
  const inferredTypeIsNotString: string = useSelector(selector, shallowEqual)

  const compare = (_l: number, _r: number) => true
  useSelector(() => 1, compare)
  const compare2 = (_l: number, _r: string) => true

  // @ts-expect-error
  useSelector(() => 1, compare2)

  interface RootState {
    property: string
  }

  const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector

  // $ExpectType string
  const r = useTypedSelector((state) => {
    // $ExpectType RootState
    state
    return state.property
  })
}

function testUseStore() {
  interface TypedState {
    counter: number
    active: boolean
  }
  interface TypedAction {
    type: 'SET_STATE'
  }

  const untypedStore = useStore()
  const state = untypedStore.getState()
  state.things.stuff.anything // any by default

  const typedStore = useStore<TypedState, TypedAction>()
  const typedState = typedStore.getState()
  typedState.counter
  // @ts-expect-error
  typedState.things.stuff
}

// These should match the types of the hooks.
function testCreateHookFunctions() {
  interface RootState {
    property: string
  }
  interface RootAction {
    type: 'TEST_ACTION'
  }

  const Context = React.createContext<
    ReactReduxContextValue<RootState, RootAction>
  >(null as any)

  // No context tests
  // $ExpectType () => Dispatch<AnyAction>
  createDispatchHook()
  // $ExpectType <Selected extends unknown>(selector: (state: any) => Selected, equalityFn?: ((previous: Selected, next: Selected) => boolean) | undefined) => Selected
  createSelectorHook()
  // $ExpectType () => Store<any, AnyAction>
  createStoreHook()

  // With context tests
  // $ExpectType () => Dispatch<RootAction>
  createDispatchHook(Context)
  // $ExpectType <Selected extends unknown>(selector: (state: RootState) => Selected, equalityFn?: ((previous: Selected, next: Selected) => boolean) | undefined) => Selected
  createSelectorHook(Context)
  // $ExpectType () => Store<RootState, RootAction>
  createStoreHook(Context)
}
