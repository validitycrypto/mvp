// Core
import React, { Component, Fragment } from "react";

// Solc
import Validation from "../contracts/communalValidation.json";
import ERC20d from "../contracts/ERC20d.json";
import Faucet from "../contracts/Faucet.json";
import ReactGA from "react-ga";

// UX
import { UIControllerSubscriber,  GlobalNav, LayoutManager, NavigationProvider, MenuSection, SkeletonContainerView, ContainerHeader, Item, ThemeProvider, modeGenerator } from "@atlaskit/navigation-next";
import { faDesktop, faStreetView, faShareAlt, faBullseye, faCoins, faIdCard, faCrosshairs, faBalanceScale, faInfo, faTag, faWallet, faWeightHanging, faUser, faUsers, faStar, faShieldAlt, faCheck, faTimes  } from "@fortawesome/free-solid-svg-icons"
import { Spotlight, SpotlightManager, SpotlightTarget, SpotlightTransition } from "@atlaskit/onboarding";
import { AutoDismissFlag, FlagGroup } from "@atlaskit/flag"
import { fade } from "@material-ui/core/styles/colorManipulator"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEthereum } from "@fortawesome/free-brands-svg-icons"
import TextField from "@atlaskit/field-text"
import Paper from "@material-ui/core/Paper"
import Select from "@atlaskit/select"
import Button from "@atlaskit/button"
import Avatar from "@atlaskit/avatar"

// External Components
import Delegation from "../components/delegation"

// Utils
import { primaryInstance } from "../utils/firebaseConfig"
import Convertor from "hex2dec"
// CSS
import styled from 'styled-components'
import "../assets/css/mvp.css"

// Preset Icons
const crosshairsIcon = () => <FontAwesomeIcon color="#ffffff" icon={faCrosshairs} className="starIcon" size="1x"/>
const positiveIcon = () => <FontAwesomeIcon color="#ffffff" icon={faCheck} className="starIcon" size="lg"/>
const bullseyeIcon = () => <FontAwesomeIcon color="#ffffff" icon={faBullseye} size="lg"/>
const negativeIcon = () => <FontAwesomeIcon color="#ffffff" icon={faTimes} className="starIcon" size="1x"/>
const trustIcon = () => <FontAwesomeIcon color="#ffffff" icon={faShieldAlt} className="starIcon" size="1x"/>
const identityIcon = () => <FontAwesomeIcon color="#ffffff" icon={faIdCard} className="starIcon" size="1x"/>
const ethIcon = () => <FontAwesomeIcon color="#ffffff" icon={faEthereum} className="starIcon" size="1x"/>
const tokenIcon = () => <FontAwesomeIcon color="#ffffff" icon={faTag} className="starIcon" size="1x"/>
const starIcon = () => <FontAwesomeIcon color="#ffffff" icon={faStar} className="starIcon" size="1x"/>
const neutralIcon = () => <FontAwesomeIcon color="#ffffff" icon={faBalanceScale} className="starIcon" size="1x"/>
const walletIcon = () => <FontAwesomeIcon color="#ffffff" icon={faWallet} size="lg"/>
const userIcon = () => <FontAwesomeIcon color="#ffffff" icon={faUser} size="lg"/>
const blankIcon = () => <svg style={{height: "5vh"}}/>

// Standards
const negativeVote = "0x4e65676174697665000000000000000000000000000000000000000000000000"
const neutralVote = "0x4e65757472616c00000000000000000000000000000000000000000000000000"
const positiveVote = "0x506f736974697665000000000000000000000000000000000000000000000000"
const decimal = Math.pow(10,18)

// Components
const customThemeMode = modeGenerator({ product: { text: "#ffffff", background: "#906eff" },});

class Mvp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      firebaseDb: this.props.firebase,
      bubbleComponent: <div/>,
      onboardTarget: null,
      demoTarget: null,
      onboardIndex: 0,
      log: [[],[],[],[]],
      themeMode: "dark",
      pastEvents: [],
      pastData: {},
      toggle: true,
      account: null,
      network: 3,
      dapp: null,
      flags: [],
      pool: 0,
    };
  }

  componentWillMount = () => {
    ReactGA.pageview('/MVP');
  }

  initialiseData = async () => {
      await this.vxDimensions()
      await this.getEvent()
      await this.getRound()
      await this.getvID()
      await this.getTotal()
      await this.getNeutral()
      await this.getNegative()
      await this.getPositive()
      await this.getEvents()
      await this.getIdentity()
      await this.getTrust()
      await this.isStaking()
      await this.isVoted()
      await this.getLog()
      await this.eventTicker(this.state.eventSubject, this.state.round)
      await this.eventType(this.state.eventSubject, this.state.round)
      await this.eventPositive(this.state.eventSubject, this.state.round)
      await this.eventNegative(this.state.eventSubject, this.state.round)
      await this.eventNeutral(this.state.eventSubject, this.state.round)
      await this.getParticipants()
      await this.getBalances()
      await this.gatherMetrics()
      await this.getEventImage(this.state.eventSubject)
      await this.getPastEvents()
      await this.renderBubbles()
  }

  refreshData = async () => {
      await this.getLog()
      await this.getEvent()
      await this.getRound()
      await this.getvID()
      await this.getTotal()
      await this.getNeutral()
      await this.getNegative()
      await this.getPositive()
      await this.getEvents()
      await this.getIdentity()
      await this.eventType(this.state.eventSubject, this.state.round)
      await this.eventTicker(this.state.eventSubject, this.state.round)
      await this.eventPositive(this.state.eventSubject, this.state.round)
      await this.eventNegative(this.state.eventSubject, this.state.round)
      await this.eventNeutral(this.state.eventSubject, this.state.round)
      await this.getParticipants()
      await this.getBalances()
      await this.isStaking()
      await this.isVoted()
      await this.gatherMetrics()
      await this.getEventImage(this.state.eventSubject)
      await this.getPastEvents()
      await this.renderBubbles()
  }

  initialiseDapp = async () => {
    const metaMask = await this.props.initialiseWeb3();
    const accounts = await metaMask.web3.eth.getAccounts();
    const validationContract = Validation.networks[metaMask.network];
    const faucetContract = Faucet.networks[metaMask.network];
    const tokenContract = ERC20d.networks[metaMask.network];
    const validationInstance = new metaMask.web3.eth.Contract(Validation.abi,
           validationContract && validationContract.adress,
    ); const tokenInstance = new metaMask.web3.eth.Contract(ERC20d.abi,
      tokenContract && tokenContract.address,
    ); const faucetInstance = new metaMask.web3.eth.Contract(Faucet.abi,
      tokenContract && faucetContract.address,
    );
    validationInstance.options.address = "0xb0192607f73dadf85577ca1720282ff9c30b6569";
    faucetInstance.options.address = "0xd54a0eb72ced60f6383c8dbbbac4119d28f45ebb";
    tokenInstance.options.address = "0xd3c15f4ef14ab2b2541e3cfc7846931e8f30d07a";
    await this.setState({
        faucet: faucetInstance,
        dapp: validationInstance,
        token: tokenInstance,
        account: accounts[0],
        network: metaMask.network,
        web3: metaMask.web3
     });
    window.addEventListener("resize", this.vxDimensions);
    await this.initialiseData()
    ReactGA.event({
      category: 'Navigation',
      action: 'MVP',
      label: 'Initialise'
   });
  };

  renderSidebar = () => {
    if(this.state.toggle) {
      ReactGA.event({ category: 'Navigation', action: 'MVP', label: 'Statistics'})
      return (this.renderStatistics())
    } else if(this.state.wallet){
      ReactGA.event({ category: 'Navigation', action: 'MVP',label: 'Wallet'});
      return (this.renderWallet())
    } else if(this.state.admin){
      ReactGA.event({ category: 'Navigation', action: 'MVP',label: 'Database'});
      return (this.renderAdmin())
    }
  }

  renderStatistics= () => {
    return (
      <Fragment>
      <ContainerHeader
      text="&nbsp;&nbsp;Voting Statistics">
      </ContainerHeader>
        <MenuSection>
          {({ className }) => (
            <div className="delegationPanel">
              <SpotlightTarget name="identityValue">
              <Item before={identityIcon} text={this.state.identity} subText="Identity" />
              <Item before={crosshairsIcon} text={this.state.events} subText="Events" />
              <Item before={starIcon} text={this.state.total} subText="Total" />
              <Item before={trustIcon} text={this.state.trust} subText="Trust" />
              <Item before={positiveIcon} text={this.state.positive} subText="Positive" />
              <Item before={neutralIcon} text={this.state.neutral} subText="Neutral" />
              <Item before={negativeIcon} text={this.state.negative} subText="Negative" />
              </SpotlightTarget>
              <br></br><br></br>
              <SpotlightTarget name="generateButton">
              <div className="generateButton">
                <Button appearance="warning" onClick={this.conformValidityId}>Generate</Button>
              </div>
              </SpotlightTarget>
              <SpotlightTarget name="stakeButton">
              <div className="stakeButton">
                <Button appearance="help" onClick={this.eventStake}>Stake</Button>
              </div>
              </SpotlightTarget>
              <div className="identityRegistration">
                Register Identity
                <SpotlightTarget name="identityInput">
                  <TextField onChange={this.logIdentity} placeholder="Identity"/>
                </SpotlightTarget>
                <div className="registerButton">
                  <Button appearance="primary" onClick={this.registerIdentity}> Register </Button>
                </div>
              </div>
            </div>
          )}
        </MenuSection>
      </Fragment>
    );
  };

  renderWallet= () => {
    return (
      <Fragment>
      <ContainerHeader
      text="&nbsp;&nbsp;Delegate Funds">
      </ContainerHeader>
        <MenuSection>
          {({ className }) => (
            <div className="delegationPanel">
              <Item before={ethIcon} text={this.state.gasBal} subText="ETH" />
              <Item before={tokenIcon} text={this.state.tokenBal} subText="VLDY" />
              <br></br>
              Transfer Validity
              <TextField onChange={this.logAddress} placeholder="Address"/>
              <TextField onChange={this.logAmount} placeholder="Amount"/>
              <div className="transferButton">
                <Button appearance="primary" onClick={this.transferValidty}> Transfer </Button>
              </div>
              <div className="faucetButton">
                <Button appearance="warning" onClick={this.redeemReward}> Faucet </Button>
              </div>
            </div>
          )}
        </MenuSection>
      </Fragment>
    );
  };

  renderAdmin= () => {
    if(this.state.account === "0x3B00c1BfF934C47B8FBb359e5e2098a1991d4928"){
    return (
      <Fragment>
      <ContainerHeader
      text="&nbsp;&nbsp;Admin Panel">
      </ContainerHeader>
        <MenuSection>
          {({ className }) => (
            <div className="delegationPanel">
            <Select className="subjectType" onChange={this.logType}
                options={[
                  { label: "dApp", value: "dApp"  },
                  { label: "Coin", value: "Coin" },
                  { label: "Token", value: "Token" },
                  { label: "Exchange", value: "Exchange" },
                ]}
                placeholder="Type"
              />
              <TextField onChange={this.logSubject} placeholder="Name"/>
              <TextField onChange={this.logTicker} placeholder="Ticker"/>
              <TextField onChange={this.logIndex} placeholder="Round"/>
              <TextField onChange={this.logHTTP} placeholder="Image"/>
           <Button appearance="primary" className="subjectButton" onClick={this.createEvent}>
           Create
           </Button>
           <Button appearance="danger" className="ownerButton" onClick={this.initialiseOwnership}>
           Initialise
           </Button>
            </div>
          )}
        </MenuSection>
      </Fragment>
    );
  } else {
    return (
      <Fragment>
      <ContainerHeader
      text="&nbsp;&nbsp;Event database">
      </ContainerHeader>
        <MenuSection>
          {({ className }) => (
            <div className="delegationPanel">
            {this.state.pastEvents.map(data => (
              <div><br></br>
              <Paper style={{ padding: "1vw", backgroundColor: fade("#ffffff", 0.125) }}>
              <div className="databaseLogo"><Avatar src={this.state.pastData[data].image} /></div>
              <div className="databaseName"><FontAwesomeIcon color="#ffffff" icon={faInfo} size="1x"/>&nbsp;&nbsp;&nbsp;{this.state.pastData[data].ticker}</div>
              <div className="databaseType"><FontAwesomeIcon color="#ffffff" icon={faCoins} size="1x"/>&nbsp;&nbsp;&nbsp;{this.state.pastData[data].type} </div>
              <div className="databasePositive"><FontAwesomeIcon color="#ffffff" icon={faCheck} size="1x"/>&nbsp;&nbsp;&nbsp;{this.state.pastData[data].positive} </div>
              <div className="databaseNegative"><FontAwesomeIcon color="#ffffff" icon={faTimes} size="1x"/>&nbsp;&nbsp;&nbsp;{this.state.pastData[data].negative} </div>
              <div className="databaseNeutral"><FontAwesomeIcon color="#ffffff" icon={faBalanceScale} size="1x"/>&nbsp;&nbsp;&nbsp;{this.state.pastData[data].neutral} </div>
              <div className="databaseRating"><FontAwesomeIcon color="#ffffff" icon={faStar} size="1x"/>&nbsp;&nbsp;&nbsp;{this.state.pastData[data].rating}</div>
              </Paper></div>
            ))}
            </div>
          )}
        </MenuSection>
      </Fragment>
     )
    }
  };

  renderBubbles = async() => {
    await this.setState({ bubbleComponent: <div/> })
    await this.setState({ bubbleComponent:
      <Delegation
        negative={parseInt(this.state.eventNegative)}
        positive={parseInt(this.state.eventPositive)}
        neutral={parseInt(this.state.eventNeutral)}
        demoTarget={this.state.demoTarget}
        user={this.state.userMetrics}
        identity={this.findIdentity}
        height={this.state.vxHeight}
        width={this.state.vxWidth}
        option={this.defineOption}
        pool={this.state.log}
        vote={this.voteEvent}
      />
    })
  }

  renderSkeleton = () => {
    return <SkeletonContainerView />;
  };

  vxDimensions = async() => {
    var dimensionHeight;  var dimensionWidth;
    if(window.innerHeight > 720){
      dimensionHeight = window.screen.height * 0.95;
      dimensionWidth = window.screen.width;
    } else {
      dimensionHeight = window.screen.height * 0.85;
      dimensionWidth = window.screen.width;
    } await this.setState({
      vxHeight: dimensionHeight,
      vxWidth: dimensionWidth
    })
  }

  handleShowContainerChange = () => {
    this.setState({ shouldShowContainer: !this.state.shouldShowContainer });
  };

  logAmount = (event) =>  { this.setState({ amount: this.state.web3.utils.toHex(this.state.web3.utils.toBN(event.target.value).mul(this.state.web3.utils.toBN(1e18))) }); }
  logIdentity = (event) =>  { this.setState({ nickname: this.state.web3.utils.fromAscii(event.target.value) }) }
  logSubject = (event) =>  { this.setState({ subject: this.state.web3.utils.fromAscii(event.target.value) }) }
  logTicker = (event) => { this.setState({ ticker: this.state.web3.utils.fromAscii(event.target.value) }) }
  logType = (event) => { this.setState({ type: this.state.web3.utils.fromAscii(event.value) }) }
  logAddress = (event) =>  { this.setState({ recipent: event.target.value }) }
  logIndex = (event) => { this.setState({ index: event.target.value }) }
  logHTTP = (event) => { this.setState({ httpSource: event.target.value }) }

  getBalances = async() => {
    const value = await this.state.token.methods.balanceOf(this.state.account).call();
    await this.setState({ tokenBal: parseFloat(value/decimal).toFixed(2) })
    await this.state.web3.eth.getBalance(this.state.account,
      async(error, value) => {
        if(error){
          console.log("Error:", error)
        } else if(value) {
          value = parseFloat(value/decimal).toFixed(2)
          this.setState({ gasBal: value })
        }
      })
  }

  gatherMetrics = async() => {
    var delegationWeight = parseInt(this.state.tokenBal/10000);
    if(this.state.stake === "False" || this.state.voted === "True") {
      delegationWeight = 0;
    } var rawMetrics = { id: this.state.id, identity: this.state.identity, weight: delegationWeight }
    this.setState({ voteBal: delegationWeight, userMetrics: rawMetrics });
  }

  getvID = async() => {
    const vID = await this.state.token.methods.validityId(this.state.account).call()
    await this.setState({
      id: vID
    })
  }

 onboardingDemo = async() => {
   var onboardingComponent;
   var onboardingTitle;
   var onboardingText;
   var targetRadius;

   if(this.state.onboardIndex === 0){
     ReactGA.event({
       category: 'Navigation',
       action: 'MVP',
       label: 'Onboarding'
    }); onboardingComponent = "eventImage"
     onboardingTitle = "Validation Topic"
     targetRadius = 100
     onboardingText =  `This is the voting subject, the aim of
     this event is for you to contribute your general sentiment
     towards the overall quality evaluated on behalf
     of the initiative.`
   } else if(this.state.onboardIndex === 1){
     onboardingTitle = "Valdiation Statistics"
     onboardingComponent = "eventStats"
     onboardingText =  `Hover over each of these modals, to get a better insight towards
     the subject name, symbol , type, number of partcipants, current statistics for
     positive, negative and neutral votes committed.`
     targetRadius = 0
   } else if(this.state.onboardIndex === 2){
     onboardingTitle = "Delegation Metrics"
     onboardingComponent = "votingMetrics"
     onboardingText =  <div>
     <p>These values represent your delegation state, users first need to stake
     their token balances in order to vote, this ensures a one person, one vote operation.</p>
     <br></br>
     <p>The weight parameter relates to one"s VLDY balance, where 10,000 VLDY equates to one vote, this is your
     general stake that will be committed to the option of choice.</p>
     </div>
     targetRadius = 100
   } else if(this.state.onboardIndex === 3){
     onboardingComponent = "menuNavigation"
     onboardingTitle = "Menu Navigation"
     targetRadius = 100
     onboardingText =  `Here we can access the delegation sidebar and the multiple menus,
     voting, transactional and the historical database of previous events.`
   } else if(this.state.onboardIndex === 4) {
     onboardingComponent = "menuNavigation"
     onboardingTitle = "Navigation Toggle"
     targetRadius = 100
     onboardingText =  `Toggle the sidebar by clicking the border, here you can register an voting
     identity, view past event scores, transact the VLDY token and triggering token staking.`
  }  else if(this.state.onboardIndex === 5) {
      onboardingComponent = "generateButton"
      onboardingTitle = "Create ValidityID"
      targetRadius = 100
      onboardingText =  `To become a validator, one must firstly generate a ValidityID, this each users
      self-soverign identity to contribute to the eco-system and is the root of all their delegation data.`
  } else if(this.state.onboardIndex === 6) {
       onboardingComponent = "identityValue"
       onboardingTitle = "Delegate Identity"
       targetRadius = 100
       onboardingText =  `This is the custom identity of choice that one and submit, it is interchangable and is more
       reknowned as a nickname of some sort.`
   } else if(this.state.onboardIndex === 7) {
     onboardingComponent = "identityInput"
      onboardingTitle = "Register Identity"
      targetRadius = 100
      onboardingText =  `To register, type your peffered name in this text box and trigger the register button below.`
  } else if(this.state.onboardIndex === 8) {
      onboardingComponent = "stakeButton"
      onboardingTitle = "Stake Tokens"
      targetRadius = 100
      onboardingText =  `To engage in voting a user must first stake that can be executed via this button but in order to do that the must have previously
      generated a ValidityID and hold a balance greater than one vote ≈ 10,000 VLDY. After confirmation of the transaction, one should see some purple bubbles
      to the centre of the page.`
  } else if(this.state.onboardIndex === 9) {
     onboardingComponent = "menuNavigation"
     onboardingTitle = "Validation Bubbles"
     targetRadius = 100
     onboardingText =  <div>
     <p>These bubbles represent votes, each size deterimines the weight and
     each color defines the option chosen, green for positive, red for negative, blue for neutral
     and finally purple for ones own tokens once when they are active in staking.</p>
     <br></br>
     <p>To vote it"s simple, drag the purple bubbles to a cluster of choice, you"ll see a modal pop up
     when a vote is detected, drag and drop all of the associated bubbles to recieve a transaction query
     via metamask. Confirm and you"ve successfully casted a vote, the application should refresh and you
     then verify the vote by hovering over bubbles within that option, which will reveal metadata for each
     bubble.</p>
     <br></br>
     <p>Happy voting!</p>
     </div>
 }
   this.setState({
     onboardRadius: targetRadius,
     onboardIndex: this.state.onboardIndex+1,
     onboardTarget: onboardingComponent,
     onboardTitle: onboardingTitle,
     onboardingText: onboardingText,
   })
}

  handleDismiss = () => {
    this.setState(prevState => ({
      flags: prevState.flags.slice(1),
    }));
  };

  addFlag = () => {
    const newFlagId = this.state.flags.length + 1;
    const flags = this.state.flags.slice();
    flags.splice(0, 0, newFlagId);
    this.setState({ flags });
  }

  defineOption = async(_option, _stack, _limit) => {
    var optionString; var titleText;
    if(_option === positiveVote){
      titleText = "Positive vote detected"
      optionString = "success";
    } else if(_option === neutralVote){
      titleText = "Neutral vote detected"
      optionString = "warning";
    } else if(_option === negativeVote){
      titleText = "Negative vote detected"
      optionString = "error";
    } await this.setState({
      optionString: optionString,
      option: titleText,
      bubbleState: _stack,
      bubbleStack: _limit }, this.handleDismiss());
      await this.addFlag();
  }

  getPositive = async() => {
    const stat = await this.state.token.methods.positiveVotes(this.state.id).call()
    await this.setState({
      positive: parseFloat(stat).toFixed(2)
    })
  }

  getNegative = async() => {
    const stat = await this.state.token.methods.negativeVotes(this.state.id).call()
    await this.setState({
      negative: parseFloat(stat).toFixed(2)
    })
  }

  getNeutral = async() => {
    const stat = await this.state.token.methods.neutralVotes(this.state.id).call()
    await this.setState({
      neutral: parseFloat(stat).toFixed(2)
    })
  }

  getTotal = async() => {
    const stat = await this.state.token.methods.totalVotes(this.state.id).call()
    await this.setState({
      total: parseFloat(stat).toFixed(2)
    })
  }

  getEvents = async() => {
    const stat = await this.state.token.methods.totalEvents(this.state.id).call()
    await this.setState({
      events: parseFloat(stat).toFixed(2)
    })
  }

  getTrust = async() => {
    const stat = await this.state.token.methods.trustLevel(this.state.id).call()
    await this.setState({
      trust: parseFloat(stat).toFixed(2)
    })
  }

  getIdentity = async() => {
    const stat = await this.state.token.methods.getIdentity(this.state.id).call()
    await this.setState({
      identity: this.state.web3.utils.toAscii(stat)
    })
  }

  findIdentity = async(_id) => {
    const stat = await this.state.token.methods.getIdentity(_id).call()
    var parse = await this.state.web3.utils.toAscii(stat);
    var blank = await this.state.web3.utils.fromAscii("");
    if(stat === blank) parse = "Validator"
    return parse
  }

  getAddress = async(_id) => {
    return await this.state.token.methods.getAddress(_id).call()
  }

  getEvent = async() => {
    const stat = await this.state.dapp.methods.currentEvent.call()
    await this.setState({
      eventDecode: this.state.web3.utils.toAscii(stat),
      eventSubject: stat
    })
  }

  getRound = async() => {
    const stat = await this.state.dapp.methods.currentRound.call()
    await this.setState({
      round: parseInt(stat)
    })
  }

  getParticipants = async() => {
    const stat = await this.state.dapp.methods.currentParticipants.call()
    await this.setState({
      participants: parseInt(stat)
    })
  }

  eventPositive = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventPositive(_subject, _round).call()
    await this.setState({
      eventPositive: Convertor.hexToDec(stat._hex)
    });
  }

  pastPositive = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventPositive(_subject, _round).call()
    return Convertor.hexToDec(stat._hex)
  }

  eventTicker = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventTicker(_subject, _round).call()
    await this.setState({
      eventTicker: this.state.web3.utils.toAscii(stat)
    });
  }

  pastTicker = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventTicker(_subject, _round).call()
    return this.state.web3.utils.toAscii(stat);
  }

  eventNegative = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventNegative(_subject, _round).call()
    await this.setState({
      eventNegative: Convertor.hexToDec(stat._hex)
    });
  }

  pastNegatitve = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventNegative(_subject, _round).call()
    return Convertor.hexToDec(stat._hex);
  }

  eventNeutral = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventNeutral(_subject, _round).call()
    await this.setState({
      eventNeutral: Convertor.hexToDec(stat._hex)
    });
  }

  pastNeutral = async(_subject, _round) => {
    var stat = await this.state.dapp.methods.eventNeutral(_subject, _round).call()
    return Convertor.hexToDec(stat._hex);
  }

  eventType = async(_subject, _round) => {
    const stat = await this.state.dapp.methods.eventType(_subject, _round).call()
    await this.setState({
      eventType: this.state.web3.utils.toAscii(stat)
    });
  }

  pastType = async(_subject, _round) => {
    const stat = await this.state.dapp.methods.eventType(_subject, _round).call()
    return stat;
  }

  registerIdentity = async() => {
    await new Promise((resolve, reject) =>
      this.state.token.methods.setIdentity(this.state.nickname)
      .send({ from: this.state.account, gas: 3725000})
      .on('confirmation', (confirmationNumber, receipt) => {
        if(confirmationNumber > 1){
          ReactGA.event({ category: 'Transactional',
          action: 'Identity',label: 'True'});
          this.getIdentity()
          resolve(receipt)
        }
      })
    )
  }

  conformValidityId = async() => {
    await new Promise((resolve, reject) =>
      this.state.token.methods.conformIdentity()
      .send({ from: this.state.account, gas: 3725000})
      .on('confirmation', (confirmationNumber, receipt) => {
        if(confirmationNumber > 1){
          ReactGA.event({ category: 'Transactional',
          action: 'ValidityID',label: 'True'})
          this.getvID()
          resolve(receipt)
        }
      })
    )
  }

  redeemReward = async() => {
    await new Promise((resolve, reject) =>
      this.state.faucet.methods.redeem()
      .send({ from: this.state.account, gas: 3725000})
      .on('confirmation', (confirmationNumber, receipt) => {
        if(confirmationNumber > 1){
          ReactGA.event({ category: 'Transactional',
           action: 'Faucet', label: 'True' })
           this.getBalances()
           resolve(receipt)
        }
      })
    )
  }

  logEvent = async() => {
    this.state.firebaseDb.collection("events").add({ eventHex: this.state.subject })
    this.state.firebaseDb.collection(this.state.subject).add({
        http: this.state.httpSource
    }).then(function(docRef) {
        console.log("Documentwritten with ID: ", docRef.id);
    }).catch(function(error) {
        console.error("Error adding document: ", error);
    });
  }

  getEventImage = async(_subject) => {
    console.log(_subject);
    await this.state.firebaseDb.collection(_subject).orderBy("http", "desc").get().then((result) => {
      var imageSource;
      result.forEach(item =>
        imageSource = item.data().http)
        this.setState({ eventImage: imageSource});
    })
  }

  getPastImage = async(_subject) => {
    return await this.state.firebaseDb.collection(_subject).orderBy("http", "desc").limit(1).get()
    .then((result) => {
      var imageSource;
      result.forEach(item => {
         imageSource = item.data().http;
       }); return imageSource;
    })
  }

  getPastEvents = async() => {
    var eventArray = {}; var pastArray = [];
       await this.state.firebaseDb.collection("events").get().then(async(result) => {
        await result.forEach(async(item) => {
          var eventSubject = item.data().eventHex
          var convertedValue = await this.state.web3.utils.toAscii(eventSubject)
          if(eventSubject !== undefined){
          var eventType = await this.state.web3.utils.toAscii(await this.pastType(eventSubject, 1))
          var eventTicker = await this.pastTicker(eventSubject, 1)
          var eventImage = await this.getPastImage(eventSubject)
          var eventPositive = await this.pastPositive(eventSubject, 1)
          var eventNegative = await this.pastNegatitve(eventSubject, 1)
          var eventNeutral = await this.pastNeutral(eventSubject, 1)
          var eventTotal = parseInt(eventPositive)/(parseInt(eventPositive) + parseInt(eventNegative) + parseInt(eventNeutral)) * 10
          var dataEmbed = {
              ticker: eventTicker,
              image: eventImage,
              type: eventType,
              positive: eventPositive,
              neutral: eventNeutral,
              negative : eventNegative,
              rating: eventTotal.toFixed(2)
            }
            eventArray[convertedValue] = dataEmbed
            pastArray.push(convertedValue)
          }
        })
        await this.setState({ pastEvents: pastArray, pastData: eventArray })
      })
  }

  isStaking = async() => {
    var input;
    const stat = await this.state.token.methods.isStaking(this.state.account).call()
    if(stat === true){ input = "True"
    } else if(stat === false){ input = "False"}
    await this.setState({
      stake: input
    })
  }

  isVoted = async() => {
    var input;
    const stat = await this.state.dapp.methods.isVoted(this.state.account).call()
    if(stat === true){ input = "True"
    } else if(stat === false){ input = "False"}
    await this.setState({
      voted: input
    })
  }

  createEvent = async() => {
    await this.state.dapp.methods.createEvent(this.state.subject, this.state.ticker, this.state.type, this.state.index)
    .send({from: this.state.account, gas: 3725000 }, async(error, transactionHash) => {
      if(error) { console.log(error)
      } else if(transactionHash) {
        await this.logEvent();
        await this.refreshData();
       }
    })
  }

  transferValidty = async() => {
    await new Promise((resolve, reject) =>
      this.state.token.methods.transfer(this.state.recipent, this.state.amount)
      .send({from: this.state.account, gas: 3725000 })
      .on('confirmation', (confirmationNumber, receipt) => {
          if(confirmationNumber > 1){
            ReactGA.event({ category: 'Transactional',
            action: 'Transfer', label: 'True' })
            this.getBalances()
            resolve(receipt)
          }
      })
    )
  }

  voteEvent = async(_decision) => {
    await new Promise((resolve, reject) =>
      this.state.dapp.methods.voteSubmit(_decision)
      .send({from: this.state.account, gas: 3725000 })
      .on('confirmation', (confirmationNumber, receipt) => {
          if(confirmationNumber > 1){
            ReactGA.event({category: 'Transactional',
            action: 'Vote', label: 'True'})
            this.refreshData()
            resolve(receipt)
          }
       })
     )
  }

  eventStake = async() => {
    const stakeStatus = await this.state.token.methods.isStaking(this.state.account).call()
    await new Promise((resolve, reject) =>
      this.state.token.methods.toggleStake()
      .send({from: this.state.account, gas: 3725000 })
      .on('confirmation', (confirmationNumber, receipt) => {
          if(confirmationNumber > 1){
            ReactGA.event({ category: 'Transactional',
            action: 'Stake', label: `${!stakeStatus}` })
            this.refreshData()
            resolve(receipt)
          }
      })
    )
  }

  getLog = async () => {
    var delegationLog = { }
    await this.state.token.events.Vote({ fromBlock: 0, toBlock: "latest"}, (event,error) => { })
    .on("data", async(eventResult) => {
      var activeEvent = JSON.stringify(eventResult.returnValues.subject).replace(/["]+/g, "");
      var blockNumber = JSON.stringify(eventResult.blockNumber).replace(/["]+/g, "");
      var transactionHash = JSON.stringify(eventResult.transactionHash).replace(/["]+/g, "");
      if(activeEvent === this.state.eventSubject){
        var choice = JSON.stringify(eventResult.returnValues.choice).replace(/["]+/g, "")
        var identifier = JSON.stringify(eventResult.returnValues.id).replace(/["]+/g, "")
        var weight = Convertor.hexToDec(JSON.stringify(eventResult.returnValues.weight._hex).replace(/["]+/g, ""))
        var identity = await this.findIdentity(identifier)
        var address = await this.getAddress(identifier)
        delegationLog[identifier] = { address, transactionHash, blockNumber, identity, choice, weight }
        await this.setState({log: delegationLog});
        }
    }).on("changed", (event) => {
        // remove event from local database
    }).on("error", console.error);
}

  initialiseOwnership = async() => {
    await this.state.token.methods.adminControl(this.state.dapp.address)
    .send({ from: this.state.account, gas: 3725000 }, async(error, transactionHash) => {
      if(error) { console.log(error)
        } else if(transactionHash) {
          await this.state.dapp.methods.initialiseAsset(this.state.token.address)
          .send({ from: this.state.account, gas: 3725000 }, (error, transactionHash) => {
            if(error) { console.log(error)
            } else if(transactionHash) { }
          })
        }
    })
  }

  render() {
    const { shouldRenderSkeleton } = this.state;
    const renderer = shouldRenderSkeleton
      ? this.renderSkeleton
      : this.renderSidebar;
       if(window.screen.height < 750 && window.screen.width < 900){
        ReactGA.event({ category: 'MVP', action: 'Mobile', label: 'True'  });
        return(
        <div className="errorModal">
          <p><FontAwesomeIcon className="errorLogo" color="red" size="2x" icon={faDesktop}/></p>
          <p>Not supported on native devices</p>
        </div>
        )
      } else if(!window.ethereum){
        ReactGA.event({ category: 'MVP', action: 'Metamask', label: 'False'  });
        return(
          <div className="errorModal">
            <p><FontAwesomeIcon className="errorLogo" color="red" size="2x" icon={faTimes}/></p>
            <p>Metamask is not detected</p>
          </div>
        )
      } else if(this.state.network !== 3){
        ReactGA.event({ category: 'MVP', action: 'Network', label: 'False'  });
        return(
        <div className="errorModal">
          <p><FontAwesomeIcon className="errorLogo" color="red" size="2x" icon={faEthereum}/></p>
          <p>Incorrect network</p>
        </div>
        )
      }
    return (
      <div className="mvpNavigation">
        <SpotlightManager>
        <NavigationProvider>
        <ThemeProvider
          theme={theme => ({
            ...theme,
            mode: customThemeMode,
          })}>
        <LayoutManager
          globalNavigation={() =>  (
            <SpotlightTarget name="menuNavigation">
            <GlobalNav primaryItems={[
              { key: "null", icon: blankIcon, label: "null", onClick: () => console.log("oi") },
              { key: "market", icon: userIcon, label: "Stats", onClick: () => this.setState({ toggle: true , wallet: false, admin: false }) },
              { key: "wager", icon: walletIcon, label: "Wallet", onClick: () => this.setState({ toggle: false , wallet: true, admin: false }) },
              { key: "settings", icon: bullseyeIcon, label: "settings" , onClick: () => this.setState({ toggle: false , wallet: false, admin: true }) },
            ]} secondaryItems ={[  ]} />
            </SpotlightTarget>
          )}
          productNavigation={renderer}
        >
        <UIControllerSubscriber>
          {navigationUIController => (
              <SpotlightTransition>
              <Spotlight
                actions={[{ text: "Next" , onClick: () => {
                  if(this.state.onboardIndex === 4){
                     navigationUIController.toggleCollapse()
                  } else if(this.state.onboardIndex === 9){
                     navigationUIController.toggleCollapse()
                   } if(this.state.onboardIndex !== 10 ){
                     this.onboardingDemo()
                   } else {
                     this.setState({
                       onboardTarget: null,
                       onboardIndex: 0
                     })
                   }
                } }]}
                dialogPlacement="right top"
                target={this.state.onboardTarget}
                key={this.state.onboardTarget}
                heading={this.state.onboardTitle}
                targetRadius={this.state.onboardRadius}>
                {this.state.onboardingText}
                </Spotlight>
                </SpotlightTransition>
              )}
            </UIControllerSubscriber>
        </LayoutManager>
      </ThemeProvider>
      </NavigationProvider>
        <SpotlightTarget name="eventStats">
        <div className="eventStats">
          <Paper className="eventName" style={{ padding: ".5vw", backgroundColor: fade("#815aff", 0.825) }}>
            &nbsp;&nbsp;&nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faInfo} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Name: {this.state.eventDecode}
          </Paper>
          <Paper className="eventTicker" style={{ padding: ".5vw", backgroundColor: fade("#815aff", 0.825) }}>
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faShareAlt} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ticker: {this.state.eventTicker}
          </Paper>
          <Paper className="eventType" style={{ backgroundColor: fade("#815aff", 0.825) }}>
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faCoins} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Type: {this.state.eventType}
          </Paper>
          <Paper className="eventPositive" style={{ backgroundColor: fade("#815aff", 0.825) }}>
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faCheck} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Positive: {this.state.eventPositive}
          </Paper>
          <Paper className="eventNeutral" style={{ backgroundColor: fade("#815aff", 0.825) }}>
            &nbsp;<FontAwesomeIcon color="#ffffff" icon={faBalanceScale} size="1x"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Neutral: {this.state.eventNeutral}
         </Paper>
         <Paper className="eventNegative" style={{ backgroundColor: fade("#815aff", 0.825) }}>
            &nbsp;&nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faTimes} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Negative: {this.state.eventNegative}
         </Paper>
        </div>
        </SpotlightTarget>
        <SpotlightTarget name="eventImage">
        <Paper className="eventBorder" style={{ borderRadius: "5vw", padding: ".5vw", backgroundColor: fade("#815aff", 0.825) }}>
          <img className="eventImage" src={this.state.eventImage} />
        </Paper>
        </SpotlightTarget>
        <SpotlightTarget name="votingMetrics">
        <div className="votingMetrics">
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faUsers} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Participants: {this.state.participants}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faCrosshairs} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Voted: {this.state.voted}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faStreetView} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Staking: {this.state.stake}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;<FontAwesomeIcon color="#ffffff" icon={faWeightHanging} size="lg"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Weight: {this.state.voteBal}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
         </div>
        </SpotlightTarget>
        <div className="validatingIdentifier">
        {this.state.id}
        </div>
        <div className="helpButton">
          <Button appearance="help" onClick={this.onboardingDemo}>
          &nbsp;Help&nbsp;
          </Button>
        </div>
        <div className="connectButton">
          <Button appearance="help" onClick={this.initialiseDapp}>
          &nbsp;Connect&nbsp;
          </Button>
        </div>
        <div className="votingBubbles">
          {this.state.bubbleComponent}
        </div>
        <FlagGroup>
         {this.state.flags.map(flagId => {
           return (
             <AutoDismissFlag
              description={`Your current delegation stack in this option is: ${this.state.bubbleState} out of ${this.state.bubbleStack}`}
              icon={<FontAwesomeIcon color="#ffffff" icon={faUser} size="lg"/>}
              actions={[{ content: "Ok", onClick: this.handleDismiss }]}
              appearance={this.state.optionString}
              title={this.state.option}
              id={flagId}
              key={flagId}
            /> )})}
           </FlagGroup>
         </SpotlightManager>
      </div>
      );
  }
}

export default Mvp;
