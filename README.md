# sample_node_app

1.	Install awscli, kubectl, eksctl in your system (source: Internet)

2.	Connect to your aws account using aws cli with below cmds

		a.	open cmd (windows) or terminal (linux)
		b.	aws configure 	-	execute this cmd
		c.	fill the respective details (access, secret keys, region, output format)
	
3.	Setup the eks cluster with eksctl cmd line as below. we can either use cli or consle for setup.

		eksctl create cluster --name prod --version 1.17 --region us-east-1 --nodegroup-name linux-nodes --node-type t2.medium --nodes 2 --nodes-min 1 --nodes-max 2 --ssh-access=true --ssh-public-key=aws --managed
		
		(Note: try eksctl --help for more information reg options)
		
4.	The cluser setup will take around 15-20 minutes as it will be creating iam role, cloudformation templates and vpc for the cluster (if we 
	didn't specified any)		

5.	Once it's done, you can see the output as Ready. try executng any kubectl cmds to check the connectivity
	
		1.	kubectl get nodes
		2.	kubectl get pods
		
6.	If the above cmds works, then you can proceed with the app deployment. If not, try to find the issue by checking logs or checking the status from 
	aws console.		
	
7.	Download any sample nodejs app from github. write Dockerfile and build the docker image with below cmds

		docker build -t sample_node_app .
		
8.	Once the image is built, we need to store the image in either dockerhub or any private registry, so that cluster can able to pull the image. 
	for testing purpose	we are pushing image to docker hub.
	
		a.	docker tag sample_node_app vrer/prod:sample_node_app
		b.	docker push vrer/prod:sample_node_app
		
		(Note: Once pushed, verify image in you dockerhub account )
		
9.	Once the image is pushed to Dockerhub, write the manifest (yaml) file to deploy the image into cluster 
	
		(reference: https://gist.githubusercontent.com/aramkoukia/c454e733cd9c95a4fe7442e349e82f8a/raw/f3918d1d4edff1128de6ec5e1cf2fab4dde60d24/kubernetes-manifest.yml )
		
10. 	Once written, deploy the manifest file and Check the status of deploy with the following cmds. 
		
		1.	kubectl apply -f prod.yaml (prod.yaml = manifest file name)
		2.	kubectl get deploy/prod (prod = deploy object name)
	
11. even though after deploying the app, end users can't access it from outside network, cause we didn't exposed the app. we need to do it by
	using any of the existing service types. for now, we are going with ALB from aws.
	
12.	To integrate alb with eks, we need to follow few steps:

		a.	create open id connector associated with it. (to use iam roles for service accounts)
		
			1.	aws eks describe-cluster --name prod --query "cluster.identity.oidc.issuer" --output text - to get open id connector
				
					example output  - https://oidc.eks.us-west-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E
		
			2.	eksctl utils associate-iam-oidc-provider --cluster prod --approve 	-	to associate open id conecctor
			
		b.	create k8s rbac role & Service Account for ALB Ingress Controller

			1.	kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/master/docs/examples/rbac-role.yaml

			2.	kubectl get sa -n kube-system
			
		c.	create iam policy to integrate alb with eks and create service account
		
			1. aws iam create-policy \
				--policy-name ALBIngressControllerIAMPolicy \
				--policy-document https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/master/docs/examples/iam-policy.json
				
			2.	eksctl create iamserviceaccount --region us-east-1 --name alb-ingress-controller --namespace kube-system --cluster prod 		--attach-policy-arn arn:aws:iam::191545360299:policy/ALBIngressControllerIAMPolicy --override-existing-serviceaccounts --approve	
	
		d.	deploy the ingress controller
		
			1.	kubectl apply -f 		https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/master/docs/examples/alb-ingress-controller.yaml
			
			2.	kubectl get deploy -n kube-system  	-	verify the deploy
			
		e.	edit the ingress manifest file to point to our cluster. add "- --cluster-name=prod" in container spec under args
		
		
13.	Once alb controller is ready, write the ingress manifest file and deploy. you can see n aws console that an new ALB is being created along with 
	target group with eks nodes. once the alb health checks finished access the application by using load balancer url.

		(example: http://b5b41197-default-prodapp-46a5-2028026933.us-east-1.elb.amazonaws.com/)