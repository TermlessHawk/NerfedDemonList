import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchUsers, getUsername } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },

    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>

        <main v-else class="page-list">

            <div class="list-container">
                <table class="list" v-if="list">

                    <tr v-for="([level, err], i) in list">

                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">
                                #{{ i + 1 }}
                            </p>

                            <p v-else class="type-label-lg">
                                Legacy
                            </p>
                        </td>


                        <td class="level"
                            :class="{ 'active': selected == i, 'error': !level }">

                            <button @click="selected = i">

                                <span class="type-label-lg">
                                    {{ level?.name || \`Error (\${err}.json)\` }}
                                </span>

                            </button>

                        </td>

                    </tr>

                </table>
            </div>


            <div class="level-container">

                <div class="level" v-if="level">

                    <h1>{{ level.name }}</h1>


                    <LevelAuthors
                        :author="level.author"
                        :creators="level.creators"
                        :verifier="level.verifier">
                    </LevelAuthors>


                    <iframe
                        class="video"
                        id="videoframe"
                        :src="video"
                        frameborder="0">
                    </iframe>


                    <ul class="stats">

                        <li>
                            <div class="type-title-sm">
                                Points when completed
                            </div>

                            <p>
                                {{ score(selected + 1, 100, level.percentToQualify) }}
                            </p>
                        </li>


                        <li>
                            <div class="type-title-sm">
                                ID
                            </div>

                            <p>
                                {{ level.id }}
                            </p>
                        </li>


                        <li>
                            <div class="type-title-sm">
                                Skill set
                            </div>

                            <p>
                                {{ level.password || 'No skill set is provided' }}
                            </p>
                        </li>

                    </ul>


                    <h2>Records</h2>


                    <p v-if="selected + 1 <= 75">
                        <strong>{{ level.percentToQualify }}%</strong> or better to qualify
                    </p>


                    <p v-else-if="selected + 1 <= 150">
                        <strong>100%</strong> or better to qualify
                    </p>


                    <p v-else>
                        This level does not accept new records.
                    </p>


                    <table class="records">

                        <tr v-for="record in level.records" class="record">


                            <td class="percent">
                                <p>
                                    {{ record.percent }}%
                                </p>
                            </td>


                            <td class="user">

                                <a
                                    :href="record.link"
                                    target="_blank"
                                    class="type-label-lg">

                                    {{ username(record.user) }}

                                </a>

                            </td>


                            <td class="mobile">

                                <img
                                    v-if="record.mobile"
                                    :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`"
                                    alt="Mobile">

                            </td>


                            <td class="hz">

                                <p>
                                    {{ record.hz }}Hz
                                </p>

                            </td>


                        </tr>

                    </table>


                </div>


                <div v-else class="level"
                    style="height: 100%; justify-content: center; align-items: center;">

                    <p>
                        (ノಠ益ಠ)ノ彡┻━┻
                    </p>

                </div>


            </div>
            
            <div class="meta-container">

                <div class="meta">

                    <div class="errors" v-show="errors.length > 0">

                        <p class="error" v-for="error of errors">
                            {{ error }}
                        </p>

                    </div>


                    <div class="og">

                        <p class="type-label-md">

                            Website layout made by

                            <a href="https://tsl.pages.dev/" target="_blank">
                                TheShittyList
                            </a>

                        </p>

                    </div>


                    <template v-if="editors">

                        <h3>List Editors</h3>


                        <ol class="editors">

                            <li v-for="editor in editors">


                                <img
                                    :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`"
                                    :alt="editor.role">


                                <a
                                    v-if="editor.link"
                                    class="type-label-lg link"
                                    target="_blank"
                                    :href="editor.link">

                                    {{ editor.name }}

                                </a>


                                <p v-else>
                                    {{ editor.name }}
                                </p>


                            </li>

                        </ol>

                    </template>


                    <h3>Submission Ruleset</h3>


                    <p>
                        Achieved the record without using hacks(including physics bypass, however FPS bypass is allowed).
                    </p>

                    <p>
                        Have clicks/taps recorded from your microphone in the video.
                    </p>

                    <p>
                        A CPS Counter must be present in the video(if you don't have it, use the "Show Info Label" Option in GD).
                    </p>

                    <p>
                        The video listed on the site must still show the full record from the raw footage.
                    </p>
                        
                    <p>
                        Do not use bug routes.
                    </p>

                    <p>
                        A Cheat Indicator is required.
                    </p>
                        
                    <p>
                        Please make sure your clicks are audible, inaudible clicks can cause your record to be rejected altogether.
                    </p>

                    <p>
                        Note that using more than one mod menu can cause suspicion.
                    </p>

                    <p>
                        If a list moderator is suspicious of your completion, they may ask for additional proof or in rare cases reject it entirely.
                    </p>

                    <p>
                        Isolated clicks are required for records in the Top 10.
                    </p>

                    <p>
                        You can submit records on the NDL Discord server.
                    </p>


                </div>

            </div>


        </main>
    `,


    data: () => ({

        list: [],

        editors: [],

        users: {},


        loading: true,

        selected: 0,

        errors: [],


        roleIconMap,

        store

    }),


    computed: {


        level() {

            return this.list[this.selected]?.[0];

        },


        video() {


            if (!this.level) {

                return "";

            }


            if (!this.level.showcase) {

                return embed(this.level.verification);

            }


            return embed(

                this.toggledShowcase

                    ? this.level.showcase

                    : this.level.verification

            );


        },


    },


    async mounted() {


        this.list = await fetchList();

        this.editors = await fetchEditors();

        this.users = await fetchUsers();



        if (!this.list) {


            this.errors = [

                "Failed to load list. Retry in a few minutes or notify list staff.",

            ];


        } else {


            this.errors.push(

                ...this.list

                    .filter(([_, err]) => err)

                    .map(([_, err]) => {

                        return `Failed to load level. (${err}.json)`;

                    })

            );


            if (!this.editors) {

                this.errors.push("Failed to load list editors.");

            }


        }



        this.loading = false;


    },


    methods: {


        embed,


        score,


        username(id) {

            return getUsername(this.users, id);

        },


    },

};
