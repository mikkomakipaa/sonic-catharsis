### Complete study-derived variable set

| Group                   | Variable                      | How study treats it                           | Sonic Catharsis relevance                |
| ----------------------- | ----------------------------- | --------------------------------------------- | ---------------------------------------- |
| **Core state**          | **State vitutus**             | Current intensity, 0–100                      | **Very high**                            |
|                         | **Trait vitutus**             | General tendency to experience vitutus, 0–100 | Medium; learn over time                  |
| **Temporal**            | **Intensity**                 | 7 levels: minimal → *vitutus maximus*         | **Very high**                            |
|                         | **Frequency**                 | yearly → multiple times/day                   | Medium                                   |
|                         | **Duration**                  | minutes → month+                              | **High**                                 |
|                         | Time of day/day               | Automatically recorded/tested                 | Low                                      |
| **Trigger / appraisal** | **Other people**              | Major trigger                                 | **Very high**                            |
|                         | **Failure**                   | Major trigger                                 | **Very high**                            |
|                         | Self / own situation          | Common free-text triggers                     | High                                     |
|                         | **Familiarity**               | How familiar the situation/experience is      | Medium                                   |
|                         | **Predictability / surprise** | Expected ↔ surprising                         | High                                     |
|                         | **Acceptability**             | Whether situation/emotion is acceptable       | High                                     |
|                         | **Understandability**         | Whether it makes sense                        | Medium                                   |
|                         | **Controllability**           | Degree of control over vitutus                | **Very high**                            |
|                         | **Randomness**                | Degree to which it feels incidental/random    | Medium                                   |
|                         | **Pleasantness**              | Pleasant ↔ unpleasant                         | Low, because almost universally negative |
| **Emotion space**       | **Pleasantness / valence**    | Fundamental emotion dimension                 | High conceptually                        |
|                         | **Arousal**                   | Calm ↔ activated                              | **Very high**                            |
|                         | Similarity to **anger**       | Strongest emotional similarity                | **Very high**                            |
|                         | Similarity to **disgust**     | Second strongest                              | High                                     |
|                         | Similarity to sadness         | Measured                                      | Medium                                   |
|                         | Similarity to fear            | Measured                                      | Medium                                   |
|                         | Similarity to anxiety         | Measured                                      | High                                     |
|                         | Similarity to depression      | Measured                                      | Low                                      |
|                         | Similarity to surprise        | Measured                                      | Medium                                   |
|                         | Similarity to joy             | Measured                                      | Low                                      |
|                         | Similarity to love            | Measured                                      | Low                                      |

The study explicitly separates **state** and **trait vitutus**, and Experiment 2 then investigates duration, intensity, frequency, regulation and cognitive appraisal. ([Nummenmaa Oy - Tutkitusti tunteista!][1]) The emotion-space analysis reduces the relationships to the familiar **valence + arousal** dimensions and places vitutus particularly close to anger and disgust. ([Nummenmaa Oy - Tutkitusti tunteista!][1])

There is then another entire group that I think is surprisingly useful for Sonic Catharsis: **regulation**.

| Regulation variable      | Study concept              | SC interpretation |
| ------------------------ | -------------------------- | ----------------- |
| **Expression**           | Let it show/hear           | Externalize       |
| **Suppression**          | Keep it inside             | Contain           |
| **Concealment**          | Prevent others noticing    | Mask              |
| **Helplessness**         | Can't do anything about it | Low control       |
| **Persistence**          | Feeling seems enduring     | Stuck             |
| **Regulatability**       | Easy to discharge/regulate | Recoverability    |
| **Attention shifting**   | Move attention elsewhere   | Distract          |
| **Positive reappraisal** | Think about happier things | Recover           |

These come directly from the regulation questionnaire; importantly, the original *purkaa vitutus* item was actually removed from the final scale because it performed poorly psychometrically. ([Nummenmaa Oy - Tutkitusti tunteista!][1])

And finally the study has a **somatic activation** layer:

**head pressure/exploding sensation → muscle tension → heart pounding → accelerated breathing**, with weaker associations with weakness, blurred vision and legs going limp. The body-map results concentrate particularly in the **head, upper limbs, chest and abdomen**. ([Nummenmaa Oy - Tutkitusti tunteista!][1])

### So I'd revise our Sonic Catharsis model

Rather than treating everything equally, I'd organize the research variables into four layers:

```text
STATE
emotion
intensity
arousal
duration
frequency

CAUSE / APPRAISAL
trigger
social origin
failure
control
predictability
acceptability
understandability
randomness

RESPONSE
expression
suppression
concealment
persistence
attention shifting
reappraisal
somatic activation

PERSON
trait vitutus
age
sex
education
relationship status
children
```

The last group really **was measured in the study**, including age, sex, education, relationship status and number of children; political orientation was also collected in Experiment 1. The study found associations with several demographic variables, while political orientation was not associated with state or trait vitutus. ([Nummenmaa Oy - Tutkitusti tunteista!][1])

But I would **not put demographic variables into the Sonic recommendation algorithm**. They're research covariates, not good product inputs. Likewise, the study found no meaningful time-of-day variation over its measurement period, so there's little reason to make "22:30 = more brutal death metal" part of the model. ([Nummenmaa Oy - Tutkitusti tunteista!][1])

## The interesting reduced model

After collecting everything, I think the **actual useful latent variables for Sonic Catharsis are only about 7**:

**Emotion · Intensity · Arousal · Trigger · Control · Persistence · Regulation direction**

And most don't need explicit UI controls.

Your existing matrix already contains **emotion × eight stress/intensity levels → genre**. 

So I would make the user experience:

**Emotion wheel** → `emotion`
**Intensity meter** → `intensity`
**“What petty injustice did you endure today?”** → infer `trigger + control + persistence + arousal`

Then:

**Descent** → `regulation_direction`

That is quite elegant because almost the entire research-informed model can be produced from **three user interactions rather than a psychological questionnaire**.

And there's one change I'd now make to my previous proposal: **don't call the third dimension simply `regulation_goal`.** I'd model it internally as a **trajectory**:

`current sonic state → desired sonic state`

That gives you a clean mathematical basis for *Match, Purge, Descend, Recover* and makes Descent a genuinely meaningful part of the recommendation engine rather than decorative lore.

[1]: https://nummenmaa.fi/wp-content/uploads/2023/08/SuuriSuomalainenVitutustutkimus.pdf "LN_JH_preprint"