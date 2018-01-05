<template lang="html">
  <div id="index">
    <transition name="fade">
      <div v-if="!showSvg" class="wrapper">
        <div @click="goAnimation(1)" class="icon icon1">
          <div class="moon top"></div>
          <div class="planet">
            <div class="line line1"></div>
            <div class="line line2"></div>
            <div class="line line3"></div>
            <div class="line line4"></div>
            <div class="line line5"></div>
            <div class="line line6"></div>
            <div class="line line7"></div>
          </div>
          <div class="moon bottom"></div>
        </div>
        <div @click="goAnimation(2)" class="icon icon2">
          <div class="planetoid"></div>
          <div class="planet"></div>
          <div class="ring"></div>
        </div>
        <div @click="goAnimation(3)" class="icon icon3">
          <div class="top">
            <div class="visor"></div>
            <div class="hood"></div>
          </div>
          <div class="bottom">
            <div class="neck"></div>
            <div class="line"></div>
          </div>
          <div class="middle"></div>
        </div>
        <div @click="goAnimation(4)" class="icon icon4">
          <div class="planet"></div>
          <div class="planetoid top"></div>
          <div class="planetoid middle"></div>
          <div class="planetoid bottom"></div>
        </div>
        <div @click="goAnimation(5)" class="icon icon5">
          <div class="planet"></div>
          <div class="rocket">
            <div class="body"></div>
            <div class="thruster left"></div>
            <div class="thruster mid"></div>
            <div class="thruster right"></div>
          </div>
          <div class="line left"></div>
          <div class="line mid"></div>
          <div class="line right"></div>
        </div>
        <div @click="goAnimation(6)" class="icon icon6">
          <div class="moon top"></div>
          <div class="planet"></div>
          <div class="ring"></div>
          <div class="ring planet"></div>
          <div class="planetoid"></div>
          <div class="moon bottom"></div>
        </div>
        <div @click="goAnimation(7)" class="icon icon7">
          <div class="telescope">
            <div class="body">
              <div class="line line1"></div>
              <div class="line line2"></div>
              <div class="line line3"></div>
              <div class="line line4"></div>
            </div>
            <div class="lens"></div>
          </div>
          <div class="tripod">
            <div class="anchor"></div>
            <div class="foot left"></div>
            <div class="foot mid"></div>
            <div class="foot right"></div>
          </div>
          <div class="ground"></div>
        </div>
        <div @click="goAnimation(8)" class="icon icon8">
          <div class="moon top"></div>
          <div class="planet"></div>
          <div class="ring"></div>
          <div class="planetoid"></div>
          <div class="moon bottom"></div>
        </div>
        <div @click="goAnimation(9)" class="icon icon9">
          <div class="planetoid"></div>
          <div class="planetoid moon"></div>
          <div class="flag">
            <div class="square"></div>
            <div class="line line1"></div>
            <div class="line line2"></div>
            <div class="line line3"></div>
          </div>
          <div class="pole"></div>
          <div class="ground"></div>
        </div>
        <div @click="goAnimation(10)" class="icon icon10">
          <div class="orbit orbit1"></div>
          <div class="orbit orbit2"></div>
          <div class="planet"></div>
        </div>
        <div @click="goAnimation(11)" class="icon icon11">
          <div class="planet">
            <div class="line line1"></div>
            <div class="line line2"></div>
            <div class="line line3"></div>
            <div class="line line4"></div>
            <div class="line line5"></div>
            <div class="line line6"></div>
            <div class="line line7"></div>
            <div class="line line8"></div>
            <div class="line line9"></div>
          </div>
        </div>
        <div @click="goAnimation(12)" class="icon icon12">
          <div class="planet"></div>
          <div class="line line1"></div>
          <div class="line line2"></div>
          <div class="line line3"></div>
          <div class="line line4"></div>
          <div class="line line5"></div>
        </div>
        <div @click="goAnimation(13)" class="icon icon13">
          <div class="planet"></div>
          <div class="ring"></div>
          <div class="planetoid"></div>
          <div class="square"></div>
          <div class="moon bottom"></div>
        </div>
        <div @click="goAnimation(14)" class="icon icon14">
          <div class="planet"></div>
          <div class="ring"></div>
          <div class="moon"></div>
          <div class="top">
            <div class="line left"></div>
            <div class="square"></div>
            <div class="line right"></div>
          </div>
          <div class="pen">
            <div class="head left"></div>
            <div class="head right"></div>
            <div class="line"></div>
            <div class="bottom"></div>
          </div>
        </div>
        <div @click="goAnimation(15)" class="icon icon15">
          <div class="planetoid"></div>
          <div class="sattelite">
            <div class="solarpanel left"></div>
            <div class="body"></div>
            <div class="solarpanel right"></div>
            <div class="dish"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'index',
  data () {
    return {
      showSvg: true
    }
  },
  methods: {
    goAnimation (id) {
      this.$router.push(`/animation/${id}`)
    }
  },
  mounted () {
    this._timer = setTimeout(() => {
      this.showSvg = false
      this._timer = null
    }, 500)
  }
}
</script>

<style lang="scss" scope>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}

$dark: #303030;
$gold: #a78247;
$borderwidth: 0.1vw;
$animationtime: 5s;

body {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  overflow: hidden;
  width: 100%;
  height: 100%;
  #index {
    width: 100%;
    height: 100%;
    background: $dark;

    @mixin bordered(){
      border: $borderwidth solid $gold;
    }

    div {
      position: absolute;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      @include bordered();
      overflow: hidden;
      &:before, &:after{
        content: '';
        display: block;
        position: absolute;
      }
    }

    .wrapper{
      position: absolute;
      top: 50%;
      left: 50%;
      width: 78vw;
      height: 70vh;
      border: 0;
      transform: translate(-50%,-50%);
      overflow: visible;

      & .icon{
        position: relative;
        display: inline-block;
        width: 12vw;
        height: 12vw;
        margin: 2.5vw 1.5vw;
        border: 0;
        overflow: visible;

        &:hover {
          cursor: pointer;
        }

        & .moon, & .planetoid, & .planet{
          border-radius: 50%;
          background: $dark;
        }

        &.icon1{

          & .moon{
            &.top{
              top: 10%;
              right: 5%;
              width: 12%;
              height: 12%;
              animation: icon1moontop $animationtime ease 0s infinite;
            }
            &.bottom{
              top: 75%;
              left: 15%;
              width: 8%;
              height: 8%;
              animation: icon1moonbottom $animationtime ease 0s infinite;
            }
          }

          & .planet{
            top: 20%;
            left: 20%;
            width: 62%;
            height: 62%;
            & .line{
              height: 0.1vw;
              border-color: $gold transparent transparent transparent;
              overflow: visible;
              &.line1{
                top: 15%;
                left: 0;
                width: 60%;
              }
              &.line2{
                top: 30%;
                left: 0;
                width: 20%;
                &:after{
                  top: -0.1vw;
                  left: 140%;
                  height: 0.1vw;
                  width: 60%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
              }
              &.line3{
                top: 38%;
                right: 0;
                width: 40%;
              }
              &.line4{
                top: 48%;
                right: 0;
                width: 18%;
              }
              &.line5{
                top: 57%;
                left: 0;
                width: 30%;
                &:after{
                  top: -0.1vw;
                  left: 140%;
                  height: 0.1vw;
                  width: 40%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
              }
              &.line6{
                top: 68%;
                left: 0;
                width: 70%;
              }
              &.line7{
                top: 80%;
                right: 0;
                width: 30%;
                &:after{
                  top: -0.1vw;
                  left: -80%;
                  height: 0.1vw;
                  width: 40%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
              }
            }
          }
        }

        &.icon2{

          & .planetoid{
            top: 15%;
            right: 9%;
            width: 10%;
            height: 10%;
            overflow: visible;
            animation: icon2planetoid $animationtime linear 1s infinite;
            &:after{
              top: -35%;
              left: -35%;
              width: 1%;
              height: 1%;
              @include bordered();
              border-radius: 50%;
            }
          }

          & .planet{
            top: 20%;
            left: 17%;
            width: 63%;
            height: 63%;
            &:after{
              top: 10%;
              left: 10%;
              width: 70%;
              height: 70%;
              @include bordered();
              border-radius: 50%;
              border-color: $gold transparent transparent transparent;
              transform: rotate(-50deg);
            }
          }

          & .ring{
            top: 40%;
            left: 10%;
            width: 77.5%;
            height: 25%;
            border-radius: 50%;
            border-color: transparent $gold $gold $gold;
            transform: rotate(-17deg);
            animation: icon2ring $animationtime linear 0s alternate infinite;
          }

        }

        &.icon3{

          & .top{
            top: -10%;
            left: 5%;
            width: 66%;
            height: 66%;
            transform: rotate(-30deg);
            border-color: transparent transparent $gold transparent;

            & .visor{
              top: 44%;
              left: 3%;
              width: 88%;
              height: 88%;
              border-radius: 50%;
              &:after{
                top: 10%;
                left: 10%;
                width: 70%;
                height: 70%;
                @include bordered();
                border-radius: 50%;
                border-color: $gold transparent transparent transparent;
                transform: rotate(-50deg);
              }

            }

            & .hood{
              top: 35%;
              left: 50%;
              width: 70%;
              height: 70%;
              border-color: transparent transparent transparent $gold;
              transform-origin: left bottom;
              animation: icon3hood $animationtime linear 0s alternate infinite;
              &:after{
                top: 0;
                left: -82%;
                width: 150%;
                padding-top: 150%;
                @include bordered();
                border-radius: 50%;
              }
            }

          }

          & .middle{
            top: 42%;
            left: 47.5%;
            width: 15%;
            height: 15%;
            border-radius: 50%;
            background: $dark;
            overflow: visible;
            transform: rotate(-30deg);
            animation: icon3middle $animationtime*3 linear 0s infinite;

            &:before{
              top: 37%;
              left: -55%;
              width: 40%;
              height: 1%;
              @include bordered();
              border-color: $gold transparent transparent transparent;
            }
          }

          & .bottom{
            top: 52%;
            left: 30%;
            width: 66%;
            height: 25%;
            border-color: $gold transparent transparent transparent;
            transform: rotate(-30deg);

            & .neck{
              top: -100%;
              left: 0;
              width: 95%;
              height: 150%;
              transform: rotate(12deg);
              border-color: transparent transparent $gold transparent;
              &:after{
                top: -37%;
                left: 0;
                width: 95%;
                padding-top: 100%;
                border-radius: 50%;
                @include bordered();
              }
            }

            & .line{
              top: 60%;
              left: 0;
              width: 85%;
              height: 1%;
              transform: rotate(12.5deg);
              border-color: transparent transparent $gold transparent;
            }

          }

        }

        &.icon4{

          & .planetoid.top{
            top: 10%;
            left: 12%;
            width: 8%;
            height: 8%;
            overflow: visible;
            transform-origin: -50% -50%;
            animation: icon4planet $animationtime linear 0s infinite;
            &:after{
              top: 83%;
              left: -48%;
              width: 1%;
              height: 1%;
              @include bordered();
              border-radius: 50%;
            }
          }

          & .planetoid.middle{
            top: 35%;
            left: 54%;
            width: 15%;
            height: 15%;
            overflow: visible;
            transform-origin: -50% 100%;
            animation: icon4planet $animationtime*2 ease-out 0s infinite;
            &:before{
              top: -20%;
              left: -20%;
              width: 50%;
              padding-top: 50%;
              @include bordered();
              border-radius: 50%;
              background: $dark;
              transform-origin: 50% 70%;
              animation: icon4planet $animationtime*2 ease-out 0s infinite;
            }
          }
          & .planetoid.bottom{
            top: 61%;
            left: 31%;
            width: 9%;
            height: 9%;
            overflow: visible;
            transform-origin: 150% -100%;
            animation: icon4planet $animationtime*2 ease-out 0s infinite;
            &:after{
              top: -28%;
              left: 122%;
              width: 1%;
              height: 1%;
              @include bordered();
              border-radius: 50%;
              transform-origin: 500% 500%;
              animation: icon4planet $animationtime*2 ease-out 0s infinite;
            }
          }

          & .planet{
            top: 20%;
            left: 18%;
            width: 65%;
            height: 65%;
            overflow: visible;
            animation: icon4planet $animationtime linear 0s infinite;
            &:after{
              top: 75%;
              left: 75%;
              width: 20%;
              height: 20%;
              @include bordered();
              border-radius: 50%;
              background: $dark;
            }
          }
        }

        &.icon5{

          & .planet{
            top: 15%;
            left: 25%;
            width: 62%;
            height: 62%;
            border-color: $gold $gold $gold transparent;
            transform: rotate(-47deg);
            overflow: visible;
            &:after{
              top: -25%;
              left: 50%;
              width: 1%;
              height: 1%;
              @include bordered();
              border-radius: 50%;
            }
          }

          & .rocket{
            top: 0;
            left: 33%;
            width: 40%;
            height: 100%;
            border-color: transparent;
            transform: rotate(47deg);

            & .body{
              top: 0;
              left: 15%;
              width: 70%;
              height: 90%;
              border-color: transparent;
              animation: icon5body $animationtime/10 ease infinite;
              &:before, &:after{
                top: -10%;
                width: 200%;
                height: 118%;
                border-radius: 50%;
                @include bordered();
              }
              &:after{
                left: -110%;
              }
            }

            & .thruster.left, & .thruster.right{
              top: 60%;
              left: 7.5%;
              width: 25%;
              height: 25%;
              border-color: transparent;
              &:before, &:after{
                border-radius: 50%;
                @include bordered();
              }
              &:before{
                top: -10%;
                width: 200%;
                height: 120%;
              }
              &:after{
                top: 60%;
                left: 30%;
                width: 132%;
                padding-top: 132%;
              }
            }

            & .thruster.right{
              left: 64.5%;
              transform: rotatey(180deg);
            }

            & .thruster.mid{
              top: 60%;
              left: 23%;
              width: 51%;
              height: 12%;
              border-color: transparent;
              &:before{
                top: 0;
                left: 0;
                width: 90%;
                padding-top: 90%;
                border-radius: 50%;
                @include bordered();
                border-color: $gold $gold transparent $gold;
                //transform: rotate(-45deg);
              }
            }
          }

          & .line{
            height: 1%;
            border-color: $gold transparent transparent transparent;
            transform: rotate(-45deg);
            transform-origin: top right;
            overflow: visible;
            &:before{
              height: 1%;
              @include bordered();
              border-color: $gold transparent transparent transparent;
            }
            &.left{
              width: 24%;
              top: 60%;
              left: 4%;
              animation: icon5line1 $animationtime/10 ease infinite reverse;
              &:before{
                top: -15%;
                left: -60%;
                width: 20%;
              }
            }
            &.mid{
              width: 44%;
              top: 50%;
              left: 5.5%;
              animation: icon5line2 $animationtime/10 ease infinite;
              &:before{
                top: -105%;
                left: 110%;
                width: 10%;
              }
            }
            &.right{
              width: 14%;
              top: 80%;
              left: 17%;
              animation: icon5line3 $animationtime/10 ease 1s infinite reverse;
              &:before{
                width: 0;
                border-color: transparent;
              }
            }
          }

        }

        &.icon6{

          & .moon{
            &.top{
              top: 15%;
              left: 10%;
              width: 8%;
              height: 8%;
              animation: icon6moontop $animationtime ease 0s infinite;
            }
            &.bottom{
              top: 85%;
              right: 5%;
              width: 1%;
              height: 1%;
              animation: icon6moonbottom $animationtime ease 0s infinite;
            }
          }

          & .planet{
            top: 25%;
            left: 24%;
            width: 63%;
            height: 63%;
          }

          & .ring{
            top: 45%;
            left: 15%;
            width: 80%;
            height: 25%;
            border-radius: 50%;
            border-color: transparent $gold $gold $gold;
            transform: rotate(17deg);
            animation: icon6ring $animationtime linear 0s infinite alternate;
            &.planet{
              top: 62.5%;
              left: 40%;
              width: 8%;
              height: 8%;
              border-color: $gold;
              background: $dark;
              z-index: 1;
              overflow: visible;
              animation: icon6ringplanet $animationtime ease 0s infinite;
              &:after{
                top: -55%;
                left: 80%;
                width: 1%;
                height: 1%;
                @include bordered();
                border-radius: 50%;
              }
            }
          }

          & .planetoid{
            top: 25%;
            left: 70%;
            width: 20%;
            height: 20%;
            overflow: visible;
            background: $dark;
            &:before{
              top: -25%;
              left: -25%;
              width: 150%;
              padding-top: 150%;
              @include bordered();
              border-radius: 50%;
              border-color: $gold $gold transparent transparent;
              transform: rotate(55deg);
              background: transparent;
            }
            &:after{
              top: 100%;
              left: 5%;
              width: 30%;
              padding-top: 15%;
              @include bordered();
              border-radius: 50%;
              border-color: transparent transparent $gold transparent;
              transform: rotate(35deg);
              background: transparent;
            }
          }

        }

        &.icon7{

          & .telescope{
            top: 15%;
            left: 10%;
            width: 75%;
            height: 33%;
            transform: rotate(-17deg);
            border-color: transparent;
            animation: icon7telescope $animationtime ease 0s infinite alternate;
            &:before, &:after{
              height: 1%;
              @include bordered();
              border-color: $gold transparent transparent transparent;
            }
            &:before{
              width: 25%;
              left: 60%;
            }
            &:after{
              bottom: 15%;
              width: 15%;
              left: 65%;
            }

            & .body{
              top: 20%;
              left: 10%;
              width: 75%;
              height: 45%;
              overflow: visible;

              & .line{
                border-color: $gold transparent transparent transparent;
                transform: rotate(90deg);
                &.line1{
                  top: 45%;
                  left: -5%;
                  width: 40%;
                }
                &.line2{
                  top: 45%;
                  left: 20%;
                  width: 28%;
                }
                &.line3{
                  top: 45%;
                  left: 45%;
                  width: 28%;
                }
                &.line4{
                  top: 45%;
                  left: 65%;
                  width: 28%;
                }
              }

            }

            & .lens{
              top: 10%;
              right: 0;
              width: 16%;
              height: 62%;
            }

          }

          & .tripod{
            top: 35%;
            left: 30%;
            width: 45%;
            height: 45%;
            border-color: transparent;

            & .anchor{
              left: 40%;
              width: 20%;
              height: 20%;
              border-radius: 50%;
            }

            & .foot{
              top: 20%;
              left: 50%;
              height: 1%;
              border-color: $gold transparent transparent transparent;
              transform-origin: top left;
              &.left{
                width: 92%;
                transform: rotate(115deg);
              }
              &.mid{
                width: 84%;
                transform: rotate(90deg);
              }
              &.right{
                width: 92%;
                transform: rotate(65deg);
              }
            }

          }

          & .ground{
            top: 80%;
            left: 30%;
            width: 45%;
            height: 1%;
            border-color: $gold transparent transparent transparent;
            overflow: visible;
            &:after{
              top: -10%;
              left: 115%;
              width: 8%;
              height: 1%;
              @include bordered();
              border-color: $gold transparent transparent transparent;
            }
          }

        }

        &.icon8{

          & .moon{
            &.top{
              top: 15%;
              left: 10%;
              width: 8%;
              height: 8%;
              overflow: visible;
              animation: icon8moontop $animationtime/2 linear 0s infinite;
              &:before{
                top: 120%;
                left: -30%;
                width: 1%;
                height: 1%;
                @include bordered();
                border-radius: 50%;
              }
            }
            &.bottom{
              top: 85%;
              right: 5%;
              width: 1%;
              height: 1%;
              animation: icon8moonbottom $animationtime ease 0s infinite;
            }
          }

          & .planet{
            top: 25%;
            left: 24%;
            width: 63%;
            height: 63%;
          }

          & .ring{
            top: 45%;
            left: 15%;
            width: 80%;
            height: 25%;
            border-radius: 50%;
            border-color: transparent $gold $gold $gold;
            transform: rotate(17deg);
            overflow: visible;
            animation: icon8ring $animationtime ease 0s infinite alternate;
            &:after{
              top: 80%;
              left: 22%;
              width: 10%;
              padding-top: 10%;
              @include bordered();
              border-color: $gold $gold transparent transparent;
              transform: rotate(45deg);
            }
          }

          & .planetoid{
            top: 25%;
            left: 70%;
            width: 20%;
            height: 20%;
            overflow: visible;
            background: $dark;
            animation: icon8planetoid $animationtime linear 0s infinite reverse;
            &:before{
              top: -25%;
              left: -25%;
              width: 150%;
              padding-top: 150%;
              @include bordered();
              border-radius: 50%;
              border-color: $gold $gold transparent transparent;
              transform: rotate(55deg);
              background: transparent;
            }
            &:after{
              top: -40%;
              left: 50%;
              width: 20%;
              padding-top: 20%;
              @include bordered();
              border-color: $gold transparent transparent $gold;
              transform: rotate(-35deg);
              background: transparent;
            }
          }

        }

        &.icon9{

          & .planetoid{
            top: 15%;
            left: 27%;
            width: 10%;
            height: 10%;
            overflow: visible;
            animation: icon9planetoid $animationtime linear 0s infinite;
            &:before{
              top: -50%;
              left: 200%;
              width: 1%;
              padding-top: 1%;
              @include bordered();
              border-radius: 50%;
              transform-origin: -450% -200%;
              animation: icon9planetoid $animationtime ease 0s infinite reverse;
            }
            &:after{
              top: -20%;
              left: 300%;
              width: 15%;
              padding-top: 15%;
              @include bordered();
              border-radius: 50%;
              transform-origin: 150% 50%;
              animation: icon9planetoid $animationtime ease $animationtime/2 infinite;
            }
          }

          & .flag{
            top: 30%;
            left: 40%;
            width: 40%;
            height: 25%;
            background: $dark;

            & .square{
              top: -$borderwidth;
              left: -$borderwidth;
              width: 45%;
              height: calc(50%  + 2*#{$borderwidth});
            }

            & .line{
              height: 1%;
              border-color: $gold transparent transparent transparent;
              &.line1{
                top: 25%;
                left: 40%;
                width: 60%;
              }
              &.line2{
                top: 50%;
                left: 40%;
                width: 60%;
              }
              &.line3{
                top: 75%;
                left: 0;
                width: 100%;
              }
            }

          }

          & .pole{
            top: 54%;
            left: 40%;
            width: 1%;
            height: 30%;
            border-color: transparent transparent transparent $gold;
          }

          & .ground{
            top: 84%;
            left: 33%;
            width: 46%;
            height: 1%;
            border-color: $gold transparent transparent transparent;
            overflow: visible;
            &:before{
              top: -$borderwidth;
              left: -25%;
              height: 10%;
              width: 10%;
              @include bordered();
              border-color: $gold transparent transparent transparent;
            }
            &:after{
              top: -5*$borderwidth;
              left: 65%;
              width: 8*$borderwidth;
              padding-top: 8*$borderwidth;
              @include bordered();
              border-radius: 50%;
              border-color: $gold $gold transparent transparent;
              transform: rotate(-45deg);
            }
          }

        }

        &.icon10{

          & .orbit, .planet{
            border-radius: 50%;
          }

          & .orbit{
            border-color: $gold $gold $gold transparent;
            overflow: visible;
            &:before{
              top: -7.5%;
              left: 30%;
              width: 15%;
              height: 15%;
              @include bordered();
              border-radius: 50%;
              background: $dark;
            }
            &.orbit1{
              top: 17.5%;
              left: 17.5%;
              width: 65%;
              height: 65%;
              transform: rotate(150deg);
              animation: icon10orbit $animationtime ease 0s infinite;
            }
            &.orbit2{
              top: 30%;
              left: 30%;
              width: 40%;
              height: 40%;
              transform: rotate(50deg);
              animation: icon10orbit $animationtime ease 0s infinite reverse;
            }
          }

          & .planet{
            top: 42.5%;
            left: 42.5%;
            width: 15%;
            height: 15%;
            animation: icon10planet $animationtime ease 0s infinite alternate;
          }

        }

        &.icon11{

          & .planet{
            top: 17.5%;
            left: 17.5%;
            width: 65%;
            height: 65%;
            overflow: visible;
            animation: icon11planet $animationtime*2 ease 0s infinite alternate;
            &:before{
              top: -10%;
              left: 73%;
              width: 25%;
              height: 25%;
              @include bordered();
              border-radius: 50%;
              border-color: $gold $gold transparent $gold;
              transform: rotate(40deg);
            }

            & .line{
              height: 1%;
              border-color: $gold transparent transparent transparent;
              &.line1{
                top: 7%;
                right: 22%;
                width: 25%;
              }
              &.line2{
                top: 18%;
                left: 10%;
                width: 55%;
              }
              &.line3{
                top: 30%;
                left: 3%;
                width: 94%;
              }
              &.line4{
                top: 40%;
                right: 0;
                width: 35%;
                overflow: visible;
                &:before{
                  top: -$borderwidth;
                  left: -60%;
                  width: 30%;
                  height: 1%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
              }
              &.line5{
                top: 50%;
                left: 0;
                width: 100%;
              }
              &.line6{
                top: 58%;
                left: 0;
                width: 28%;
                overflow: visible;
                &:before{
                  top: -$borderwidth;
                  left: 130%;
                  width: 30%;
                  height: 1%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
              }
              &.line7{
                top: 68%;
                left: 3%;
                width: 58%;
                overflow: visible;
                &:before{
                  top: -$borderwidth;
                  left: 120%;
                  width: 40%;
                  height: 1%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
                &:after{
                  margin-top: -15%;
                  left: 100%;
                  padding: 8%;
                  @include bordered();
                  border-radius: 50%;
                }
              }
              &.line8{
                top: 80%;
                right: 10%;
                width: 25%;
                overflow: visible;
                &:before{
                  top: -0.1vw;
                  left: -70%;
                  width: 30%;
                  height: 1%;
                  @include bordered();
                  border-color: $gold transparent transparent transparent;
                }
              }
              &.line9{
                top: 93%;
                left: 25%;
                width: 25%;
              }
            }

          }

        }

        &.icon12{

          & .planet{
            top: 25%;
            left: 10%;
            width: 65%;
            height: 65%;
            animation: icon12planet $animationtime/10 linear infinite alternate;
            &:before{
              top: 17.5%;
              left: 17.5%;
              width: 65%;
              height: 65%;
              @include bordered();
              border-radius: 50%;
            }
          }

          & .line{
            height: 1%;
            border-color: $gold transparent transparent transparent;
            transform-origin: top left;
            transform: rotate(-45deg);
            overflow: visible;
            &.line1{
              top: 32%;
              left: 22%;
              width: 30%;
              animation: icon12line1 $animationtime/10 ease infinite alternate;
            }
            &.line2{
              top: 63%;
              left: 25%;
              width: 20%;
              animation: icon12line2 $animationtime/10 ease infinite alternate;
              &:before, &:after{
                top: -$borderwidth;
                height: 1%;
                @include bordered();
                border-color: $gold transparent transparent transparent;
              }
              &:before{
                width: 65%;
                left: 145%;
              }
              &:after{
                width: 65%;
                left: 250%;
              }
            }
            &.line3{
              top: 63%;
              left: 42%;
              width: 20%;
              animation: icon12line3 $animationtime/10 ease infinite alternate;
              &:before{
                top: -0.2vw;
                height: 1%;
                @include bordered();
                border-color: $gold transparent transparent transparent;
                width: 145%;
                left: 135%;
              }
            }
            &.line4{
              top: 67%;
              left: 55%;
              width: 50%;
              animation: icon12line4 $animationtime/10 ease infinite alternate;
              &:before{
                top: -0.2vw;
                left: 110%;
                width: 10%;
                height: 1%;
                @include bordered();
                border-color: $gold transparent transparent transparent;
              }
            }
            &.line5{
              top: 80%;
              left: 65%;
              width: 50%;
              animation: icon12line5 $animationtime/10 ease infinite alternate;
            }
          }

        }

        &.icon13{

          & .moon{
            &.bottom{
              top: 75%;
              right: 5%;
              width: 1%;
              height: 1%;
              animation: icon13moonbottom $animationtime ease 0s infinite;
            }
          }

          & .planet{
            top: 17.5%;
            left: 17.5%;
            width: 65%;
            height: 65%;
          }

          & .ring{
            top: 38%;
            left: 10%;
            width: 80%;
            height: 24%;
            border-radius: 50%;
            border-color: transparent $gold $gold $gold;
            transform: rotate(17deg);
            animation: icon13ring $animationtime ease 0s infinite alternate;
          }

          & .planetoid{
            top: 15%;
            left: 60%;
            width: 20%;
            height: 20%;
            background: $dark;
          }

          & .square{
            top: 12%;
            left: 45%;
            width: 40%;
            height: 26%;
            border-radius: 0;
            background: transparent !important;
            overflow: visible;
            &:before{
              top: -10%;
              left: 0;
              width: 20%;
              height: 5%;
              @include bordered();
              border-color: $gold $gold transparent transparent;
              animation: icon13click $animationtime/2 ease infinite alternate;
            }
          }

        }

        &.icon14{

          & .top{
            top: 12.5%;
            left: 10%;
            width: 80%;
            height: 10%;
            border-color: transparent;
            overflow: visible;

            & .line{
              top: 49%;
              height: 2%;
              width: 36%;
              border-color: $gold transparent transparent transparent;
              overflow: visible;
              &:before{
                margin-top: -25%;
                padding: 18%;
                @include bordered();
                border-radius: 50%;
              }
              &.left{
                left: 15%;
                transform-origin: 100% 50%;
                animation: icon14lineleft $animationtime linear 0s infinite alternate;
                &:before{
                  margin-left: -50%;
                }
              }
              &.right{
                right: 15%;
                transform-origin: 0% 50%;
                animation: icon14lineright $animationtime linear 0s infinite alternate;
                &:before{
                  margin-left: 100%;
                }
              }
            }

            & .square{
              top: -$borderwidth;
              left: calc(45% - #{$borderwidth});
              padding: 6%;
              background: $dark;
              z-index: 1;
            }

          }

          & .planet{
            top: 17.5%;
            left: 17.5%;
            width: 65%;
            height: 65%;
            border-color: $gold $gold transparent $gold;
            transform: rotate(15deg);
            overflow: visible;
            animation: icon14planet $animationtime ease 0s infinite alternate;
            &:after{
              top: 75%;
              width: 15%;
              padding-top: 15%;
              @include bordered();
              transform: rotate(-15deg);
              background: $dark;
            }
          }

          & .ring{
            top: 37.5%;
            left: 10%;
            width: 80%;
            height: 25%;
            border-radius: 50%;
            border-color: transparent $gold $gold $gold;
            transform: rotate(17deg);
            animation: icon14ring $animationtime ease 0s infinite alternate;
          }

          & .moon{
            top: 90%;
            left: 10%;
            width: 12%;
            height: 12%;
            animation: icon14moon $animationtime ease-in-out 0s infinite alternate;
          }

          & .pen{
            top: 22%;
            left: 30%;
            width: 40%;
            height: 65%;
            border: 0;
            overflow: visible;

            & .head.left{
              top: 0;
              left: 38%;
              height: 65%;
              width: 1%;
              border-color: transparent transparent transparent $gold;
              transform-origin: top left;
              transform: rotate(20deg);
              overflow: visible;
              &:before{
                top: 100%;
                left: -1.5*$borderwidth;
                height: 40%;
                width: 1%;
                @include bordered();
                border-color: transparent transparent transparent $gold;
                transform-origin: top center;
                transform: rotate(-60deg);
              }
            }

            & .head.right{
              top: 0;
              left: 60%;
              height: 65%;
              width: 1%;
              border-color: transparent transparent transparent $gold;
              transform-origin: top center;
              transform: rotate(-20deg);
              overflow: visible;
              &:before{
                top: 100%;
                right: -1.5*$borderwidth;
                height: 40%;
                width: 1%;
                @include bordered();
                border-color: transparent transparent transparent $gold;
                transform-origin: top center;
                transform: rotate(60deg);
              }
            }

            & .line{
              top: 0;
              left: 50%;
              width: 1%;
              height: 45%;
              border-color: transparent transparent transparent $gold;
              overflow: visible;
              &:after{
                top: 100%;
                left: -2*$borderwidth;
                width: 2*$borderwidth;
                padding-top: 2*$borderwidth;
                @include bordered();
                border-radius: 50%;
              }
            }

            & .bottom{
              top: 80%;
              left: 18%;
              width: 64%;
              height: 15%;

            }

          }

        }

        &.icon15{

          & .planetoid{
            top: 10%;
            left: 20%;
            width: 10%;
            height: 10%;
            overflow: visible;
            animation: icon15planetoid $animationtime linear 0s infinite;
            &:before{
              top: 110%;
              left: -60%;
              width: 1%;
              height: 1%;
              @include bordered();
              border-radius: 50%;
            }
          }

          & .sattelite{
            top: 20%;
            left: 10%;
            width: 100%;
            height: 70%;
            transform: rotate(-45deg);
            border: 0;
            animation: icon15sattelite $animationtime linear 0s infinite alternate;

            & .solarpanel{
              top: 15%;
              width: 30%;
              height: 30%;
              overflow: visible;
              animation: icon15solarpanel $animationtime*2 linear 0s infinite alternate;
              &:after{
                top: 50%;
                height: 1%;
                width: 125%;
                @include bordered();
                border-color: $gold transparent transparent transparent;
              }
              &.left{
                left: 0;
              }
              &.right{
                right: 0;
                &:after{
                  left: -30%;
                }
              }
            }

            & .body{
              top: 0;
              left: 38%;
              width: 25%;
              height: 60%;
              overflow: visible;
              &:after{
                top: 70%;
                left: -$borderwidth;
                width: 100%;
                padding-top: 100%;
                @include bordered();
                border-color: transparent $gold $gold transparent;
                border-radius: 50%;
                transform: rotate(45deg);
              }
            }

            & .dish{
              top: 76%;
              left: 40%;
              width: 20%;
              padding-top: 20%;
              border-color: $gold $gold transparent transparent;
              border-radius: 50%;
              transform: rotate(-45deg);
              overflow: visible;
              animation: icon15dish $animationtime linear 0s infinite alternate;
              &:before, &:after{
                transform-origin: top left;
                @include bordered();
              }
              &:before{
                left: 10%;
                top: 10%;
                width: 110%;
                height: 0;
                border-color: $gold transparent transparent transparent;
                transform: rotate(45deg);
              }
              &:after{
                left: 50%;
                top: 50%;
                width: 20%;
                height: 0;
                border-color: $gold transparent transparent transparent;
                transform: rotate(135deg);
              }
            }

          }

        }

      }

    }

    @keyframes icon1moontop{
      0% {top: 10%;right: 5%;z-index:0;}
      49% {top: 60%;right: 95%;z-index:0;}
      50% {top: 60%;right: 95%;z-index:1;}
      99% {top: 10%;right: 5%;z-index:1;}
      100% {top: 10%;right: 5%;z-index:0;}
    }
    @keyframes icon1moonbottom{
      0% {top: 75%;left: 15%;z-index:0;}
      49% {top: 40%;left: 95%;z-index:0;}
      50% {top: 40%;left: 95%;z-index:-1;}
      99% {top: 75%;left: 15%;z-index:-1;}
      100% {top: 75%;left: 15%;z-index:0;}
    }

    @keyframes icon2planetoid{
      0% {top: 15%;left: 90%;transform:rotate(0deg);z-index:0;}
      49% {top: 80%;left: 5%;transform:rotate(720deg);z-index:0;}
      50% {top: 80%;left: 5%;transform:rotate(720deg);z-index:1;}
      99% {top: 15%;left: 90%;transform:rotate(1440deg);z-index:1;}
      100% {top: 15%;left: 90%;transform:rotate(1440deg);z-index:0;}
    }
    @keyframes icon2ring{
      0% {transform:rotate(-10deg);}
      100% {transform:rotate(-30deg);}
    }

    @keyframes icon3hood{
      0% {transform:rotate(10deg);}
      100% {transform:rotate(-10deg);}
    }
    @keyframes icon3middle{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(-360deg);}
    }

    @keyframes icon4planet{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }

    @keyframes icon5body{
      0% {top:0%;left:15%;}
      100% {top:0.5%;left:15.5%;}
    }
    @keyframes icon5line1{
      0% {top:60%;left:4%;}
      100% {top:60.5%;left:4.5%;}
    }
    @keyframes icon5line2{
      0% {top:50%;left:5.5%;}
      100% {top:50.5%;left:6%;}
    }
    @keyframes icon5line3{
      0% {top:80%;left:17%;}
      100% {top:80.5%;left:17.5%;}
    }

    @keyframes icon6moontop{
      0% {top: 15%;left: 10%;z-index:0;}
      49% {top: 60%;left: 95%;z-index:0;}
      50% {top: 60%;left: 95%;z-index:1;}
      99% {top: 15%;left: 10%;z-index:1;}
      100% {top: 15%;left: 10%;z-index:0;}
    }
    @keyframes icon6moonbottom{
      0% {top: 85%;left: 95%;z-index:0;}
      49% {top: 40%;left: 5%;z-index:0;}
      50% {top: 40%;left: 5%;z-index:-1;}
      99% {top: 85%;left: 95%;z-index:-1;}
      100% {top: 85%;left: 95%;z-index:0;}
    }
    @keyframes icon6ring{
      0% {transform:rotate(10deg);}
      100% {transform:rotate(30deg);}
    }
    @keyframes icon6ringplanet{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }

    @keyframes icon7telescope{
      0% {transform:rotate(-10deg);}
      100% {transform:rotate(-30deg);}
    }

    @keyframes icon8moontop{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }
    @keyframes icon8moonbottom{
      0% {top: 85%;left: 95%;z-index:0;}
      49% {top: 40%;left: 5%;z-index:0;}
      50% {top: 40%;left: 5%;z-index:-1;}
      99% {top: 85%;left: 95%;z-index:-1;}
      100% {top: 85%;left: 95%;z-index:0;}
    }
    @keyframes icon8ring{
      0% {transform:rotate(30deg);}
      100% {transform:rotate(10deg);}
    }
    @keyframes icon8planetoid{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }

    @keyframes icon9planetoid{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }

    @keyframes icon10orbit{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }
    @keyframes icon10planet{
      0% {transform:scale(1);}
      100% {transform:scale(1.25);}
    }

    @keyframes icon11planet{
      0% {transform:rotate(10deg);}
      100% {transform:rotate(-10deg);}
    }

    @keyframes icon12planet{
      0% {top:25%;left:10%;}
      100% {top:25.5%;left:10.5%;}
    }
    @keyframes icon12line1{
      0% {top:32%;left:22%;}
      100% {top:32.5%;left:22.5%;}
    }
    @keyframes icon12line2{
      0% {top:63%;left:25%;}
      100% {top:63.5%;left:25.5%;}
    }
    @keyframes icon12line3{
      0% {top:63%;left:42%;}
      100% {top:63.5%;left:42.5%;}
    }
    @keyframes icon12line4{
      0% {top:67%;left:55%;}
      100% {top:67.5%;left:55.5%;}
    }
    @keyframes icon12line5{
      0% {top:80%;left:65%;}
      100% {top:81%;left:66%;}
    }

    @keyframes icon13moonbottom{
      0% {top: 85%;left: 95%;z-index:0;}
      49% {top: 10%;left: 5%;z-index:0;}
      50% {top: 10%;left: 5%;z-index:-1;}
      99% {top: 85%;left: 95%;z-index:-1;}
      100% {top: 85%;left: 95%;z-index:0;}
    }
    @keyframes icon13ring{
      0% {transform:rotate(10deg);}
      100% {transform:rotate(30deg);}
    }
    @keyframes icon13click{
      0% {transform:scaley(1);}
      100% {transform:scaley(0);}
    }

    @keyframes icon14lineleft{
      0% {transform:rotate(-5deg);}
      100% {transform:rotate(5deg);}
    }
    @keyframes icon14lineright{
      0% {transform:rotate(-5deg);}
      100% {transform:rotate(5deg);}
    }
    @keyframes icon14planet{
      0% {transform:rotate(10deg);}
      100% {transform:rotate(20deg);}
    }
    @keyframes icon14ring{
      0% {transform:rotate(30deg);}
      100% {transform:rotate(10deg);}
    }
    @keyframes icon14moon{
      0% {left:5%;}
      100% {left:95%;}
    }

    @keyframes icon15sattelite{
      0% {transform:rotate(-40deg);}
      100% {transform:rotate(-50deg);}
    }
    @keyframes icon15planetoid{
      0% {transform:rotate(0deg);}
      100% {transform:rotate(360deg);}
    }
    @keyframes icon15solarpanel{
      0% {transform:scaley(1);}
      100% {transform:scaley(0.75);}
    }
    @keyframes icon15dish{
      0% {transform:rotate(-60deg);}
      100% {transform:rotate(-30deg);}
    }
  }
}
</style>
