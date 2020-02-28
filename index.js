import React, {Component} from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Dimensions,
  Easing
} from 'react-native';
const {width} = Dimensions.get('window');
const height = Platform.OS !== 'ios' && Dimensions.get('screen').height !== Dimensions.get('window').height 
              && StatusBar.currentHeight > 24 
              ? Dimensions.get('window').height + StatusBar.currentHeight 
              : Dimensions.get('window').height;

class SwipeAbleDrawer extends Component {

  static defaultProps = {
    scalingFactor: 0.5,
    minimizeFactor: 0.5,
    bottomPosition: 0,
    frontBorderRadius:0,
    swipeOffset: 10,
  };

  constructor(props) {
    super(props);
    this.state = {
      bottomPosition: props.bottomPosition,
      isOpen: false,
      dims: Dimensions.get("window"),
      heightInner: Platform.OS !== 'ios' && Dimensions.get('screen').height !== Dimensions.get('window').height 
              && StatusBar.currentHeight > 24 
              ? Dimensions.get('window').height + StatusBar.currentHeight 
              : Dimensions.get('window').height,
    };
    if(this.props.position==='right'){
      this.isPositionRight= true
    }else if (this.props.position==='left'){
      this.isPositionRight= false
    }
    this.isBlockDrawer = false;
    this.translateX = 0;
    this.translateY = 0;
    this.scale = 1;
    this.borderRadius = 0;
    this.maxBorderRadius = this.props.frontBorderRadius;
    this.maxTranslateXValue = (-1)**this.isPositionRight * Math.ceil(this.state.dims.width * props.minimizeFactor);

    const heightScalled = height*props.scalingFactor;
    const initPosition = (height - heightScalled)/2;
    const finalPosition = height - (heightScalled+props.bottomPosition);
    this.maxTranslateYValue = finalPosition - initPosition;

    this.drawerAnimation = new Animated.Value(0);
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._onStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponder,
      onPanResponderMove: this._onPanResponderMove,
      onPanResponderRelease: this._onPanResponderRelease
    });
    Dimensions.addEventListener("change", this.dimhandler);
  }

  updateDims = dims => {
    const height = Platform.OS !== 'ios' && dims.screen.height !== dims.window.height 
    && StatusBar.currentHeight > 24 
    ? dims.window.height + StatusBar.currentHeight 
    : dims.window.height;

    this.setState({
        dims: dims.window,
        heightInner:height
    })
  }

  dimhandler = dims => this.updateDims(dims);

  blockSwipeAbleDrawer = (isBlock) => {
    this.isBlockDrawer = isBlock;
  };

  _onStartShouldSetPanResponder = (e, gestureState) => {
    if (this.state.isOpen) {
      this.scale = this.props.scalingFactor;
      this.translateX = this.maxTranslateXValue;
      this.translateY = this.maxTranslateYValue;
      this.borderRadius = this.maxBorderRadius;
      this.setState({isOpen: false}, () => {
        this.props.onClose && this.props.onClose();
        this.onDrawerAnimation()
      });
    }
  };
  _onMoveShouldSetPanResponder = (e, {dx, dy, moveX}) => {
    if (!this.isBlockDrawer) {
      if (this.isPositionRight){
        return ((Math.abs(dx) > Math.abs(dy)
          && dx < 20  && moveX > this.state.dims.width - this.props.swipeOffset) || this.state.isOpen);
      }else{
        return ((Math.abs(dx) > Math.abs(dy)
          && dx < 20 && moveX < this.props.swipeOffset) || this.state.isOpen);
      }
    }
    return false;
  };

  _onPanResponderMove = (e, {dx}) => {
    if (!this.state.isOpen){
      if ((-1)**this.isPositionRight * dx < 0 ) return false;
      if ( Math.abs(Math.round(dx)) < Math.abs(this.maxTranslateXValue)) {
        this.translateX = Math.round(dx);
        this.scale = 1 - ((this.translateX  * (1 - this.props.scalingFactor)) / this.maxTranslateXValue);
        this.translateY = this.maxTranslateYValue * (this.translateX / this.maxTranslateXValue);
        this.borderRadius = this.maxBorderRadius * (this.translateX / this.maxTranslateXValue);
        this.frontRef.setNativeProps({
          style: {
            transform: [
              {translateX: this.translateX},
              {translateY: this.translateY},
              {scale: this.scale}],
            opacity: this.opacity,
            borderRadius: this.borderRadius
          }
        });
        Animated.event([
          null, {dx: this.drawerAnimation}
        ]);
      }
    }
  };

  _onPanResponderRelease = (e, {dx}) => {
    if ((-1)**this.isPositionRight *dx < 0 && !this.state.isOpen) return false;
    if ((-1)**this.isPositionRight * dx > this.state.dims.width * 0.1) {
      this.setState({isOpen: true}, () => {
        this.scale = this.props.scalingFactor;
        this.translateX = this.maxTranslateXValue;
        this.translateY = this.maxTranslateYValue;
        this.borderRadius = this.maxBorderRadius;
        this.props.onOpen && this.props.onOpen();
      });
      this.onDrawerAnimation();
    } else {
      this.setState({isOpen: false}, () => {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.borderRadius = 0;
        this.props.onClose && this.props.onClose();
      });
      this.onDrawerAnimation();
    }
  };

  onDrawerAnimation() {
    this.drawerAnimation.setValue(0);
    Animated.timing(
      this.drawerAnimation,
      {
        toValue: 1,
        duration: this.props.duration || 250,
        Easing: Easing.linear
      }
    ).start();
  }


  animationInterpolate() {
    return this.state.isOpen ?
      {
        translateX: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateX, this.maxTranslateXValue],
          extrapolate: 'clamp'
        }),
        translateY: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateY, this.maxTranslateYValue],
          extrapolate: 'clamp'
        }),
        scale: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.scale, this.props.scalingFactor],
          extrapolate: 'clamp'
        }),
        borderRadius: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.borderRadius, this.maxBorderRadius],
          extrapolate: 'clamp'
        })
      }
      :
      {
        translateX: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateX, 0],
          extrapolate: 'clamp'
        }),translateY: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateY, 0],
          extrapolate: 'clamp'
        }),
        scale: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.scale, 1],
          extrapolate: 'clamp'
        }),
        borderRadius: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.borderRadius, this.maxBorderRadius],
          extrapolate: 'clamp',
        })
      }
  }

  close = () => {
    this.scale = this.props.scalingFactor;
    this.translateX = this.maxTranslateXValue;
    this.translateY = this.maxTranslateYValue;
    this.borderRadius = this.maxBorderRadius;
    this.setState({isOpen: false}, () => {
      this.onDrawerAnimation();
      this.props.onClose && this.props.onClose();
    });
  };

  open = () => {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.borderRadius = 0;
    this.setState({isOpen: true}, () => {
      this.props.onOpen && this.props.onOpen();
      this.onDrawerAnimation()
    })
  };

  isOpen = () => {
    return this.state.isOpen;
  };

  render() {
    const translateX = this.animationInterpolate().translateX;
    const translateY = this.animationInterpolate().translateY;
    const scale = this.animationInterpolate().scale;
    const borderRadius = this.animationInterpolate().borderRadius;

    return (
      <View style={styles.container}>
        <Animated.View
          {...this.panResponder.panHandlers}
          ref={ref => this.frontRef = ref}
          style={[styles.front, {
            height:this.state.heightInner,
            transform: [{translateX}, {translateY}, {scale}],
            borderRadius: borderRadius,
          },
            styles.shadow,
            this.props.frontStyle]
          }
        >
          <Animated.View style={{
              borderRadius: borderRadius,
              overflow: 'hidden',
              flex: 1
            }}>
              {this.props.children}
            </Animated.View>
            {this.state.isOpen && <View style={styles.mask}/>}
        </Animated.View>
        <View style={[styles.drawer, this.props.contentWrapperStyle,{height:this.state.heightInner, width: this.state.dims.width}]}>
          {this.props.content}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dedede',
  },
  drawer: {
    position: "absolute",
    top: 0,
    zIndex: 1
  },
  front: {
    backgroundColor: "white",
    height: height,
    zIndex: 2
  },
  mask: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "transparent"
  },
  shadow: {
    shadowOffset: {
      width: -10,
      height: 0,
    },
    shadowColor: 'rgba(0,0,0,0.8)',
    shadowOpacity: 1,
    shadowRadius: 19,
    left: 0
  }
});

const floatRange = (props, propName, componentName) => {
  if (props[propName] < 0.1 || props[propName] >= 1) {
    return new Error(
      `Invalid prop ${propName} supplied to ${componentName}. ${propName} must be between 0.1 and 1.0`
    )
  }
};

SwipeAbleDrawer.propTypes = {
  scalingFactor: floatRange,
  minimizeFactor: floatRange,
  swipeOffset: Number,
  position:'right'||'left',
  contentWrapperStyle: Object,
  frontStyle: Object,
  content: Object,
  bottomPosition: Number,
  frontBorderRadius: Number
};

SwipeAbleDrawer.defaultProps = {
  position:'left',
  frontBorderRadius:0,
  bottomPosition: 0,
};
export default SwipeAbleDrawer;
