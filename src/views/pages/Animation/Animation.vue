<template lang="html">
  <div id="animation">
    <transition name="fade">
      <div class="is-loading" v-if="isLoading">
        <loading></loading>
      </div>
    </transition>
    <transition name="fade">
      <div class="component-wrapper" v-if="showComponent">
        <component :is="component"></component>
      </div>
    </transition>
  </div>
</template>

<script>
import loading from '../../components/loading'
import page1 from './_id/1'
import page2 from './_id/2'
import page3 from './_id/3'
import page4 from './_id/4'

export default {
  name: 'animation',
  data () {
    return {
      component: '',
      isLoading: false,
      showComponent: false
    }
  },
  mounted () {
    this.isLoading = true
    this.component = `page${this.$route.params.id}`
    this.$nextTick(() => {
      let _timer = setTimeout(() => {
        _timer = null
        this.isLoading = false
        this.$nextTick(() => {
          this.showComponent = true
        })
      }, 2500)
    })
  },
  components: {
    loading,
    page1
  }
}
</script>

<style lang="scss">
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
