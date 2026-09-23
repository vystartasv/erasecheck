# Product research

## Hypothesis
Agent applications can make their own deletion callbacks and persistence paths testable by planting a synthetic canary and checking named application-controlled stores after deletion.

## Simplest alternative
An app-specific integration test can seed and query the same stores with no extra harness or adapter contract. That is the simpler choice for one application. EraseCheck is only useful if its shared lifecycle, result format, and reusable adapter boundary lower effort across multiple deletion paths or projects.

## Demand status
User demand is unknown. No customer interviews, usage observations, or market sizing were used to infer demand. Provider-internal storage and retention are outside EraseCheck's observable app-controlled scope; this project makes no claims about them.

## Kill condition
Stop investment if, after five independent agent-app teams attempt an adapter, three or more cannot complete a first useful check in under 30 minutes without maintainer help, or teams consistently report that a native integration test is simpler. Treat this as a proposed validation threshold, not observed data.

## Evidence boundary
EraseCheck does not inspect or report provider-internal data storage or retention. No provider-specific retention assertions are part of this project.
