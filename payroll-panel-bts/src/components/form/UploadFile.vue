<template>
  <div>
    <q-file
      v-model="fileValue"
      color="teal"
      dense
      filled
      type="file"
      @input="takeValue"
      ><template v-slot:prepend>
        <q-icon name="cloud_upload" />
      </template>
    </q-file>
  </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";

const fileValue = ref(null);
const emit = defineEmits(["sendValue"]);

const takeValue = (e) => {
  let img = URL.createObjectURL(e.target.files[0]);
  const formData = new FormData();
  formData.append("file", img);



  emit("sendValue", {
    type: "file",
    id: props.data._id,
    section: props.section._id,
    response: formData,
  });
};

const props = defineProps({
  data: Object,
  section: Object,
});

const submitFile = (e) => {
  console.log(e.target.files[0]);
};
</script>
